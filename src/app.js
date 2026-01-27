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
});

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

    // Monthly insights explaining performance drivers
    const monthlyInsights = [
        { // Jan
            reason: 'Higher than target',
            drivers: ['Post-holiday elective procedure surge', 'Deductible resets driving utilization', 'Flu season ED visits'],
            impact: 'Increase'
        },
        { // Feb
            reason: 'Improving trend',
            drivers: ['Care management interventions taking effect', 'Reduced ED utilization vs January', 'Weather-related visit postponements'],
            impact: 'Decrease'
        },
        { // Mar
            reason: 'Continued improvement',
            drivers: ['Network leakage reduction efforts (cardiology)', 'Lower inpatient admits per 1K', 'Generic drug initiatives'],
            impact: 'Decrease'
        },
        { // Apr
            reason: 'Strong performance',
            drivers: ['SNF utilization down 12%', 'Preventive care outreach working', 'High-cost claimant below trend'],
            impact: 'Decrease'
        },
        { // May
            reason: 'Best performance YTD',
            drivers: ['Successful urgent care steering', 'Reduced imaging utilization', 'Value-based contracts performing'],
            impact: 'Decrease'
        },
        { // Jun
            reason: 'Maintaining low PMPM',
            drivers: ['Summer seasonality (lower utilization)', 'ACO quality bonuses earned', 'Pharmacy management savings'],
            impact: 'Decrease'
        },
        { // Jul
            reason: 'Lowest PMPM of year',
            drivers: ['Vacation season (deferred elective care)', 'Care coordination wins', 'Telehealth adoption up 23%'],
            impact: 'Decrease'
        },
        { // Aug
            reason: 'Slight increase from July',
            drivers: ['Back-to-school visits', 'Deferred procedures scheduled', 'Normal seasonal variation'],
            impact: 'Slight Increase'
        },
        { // Sep
            reason: 'Uptick in utilization',
            drivers: ['Q3 elective surgery catch-up', 'Specialists returning from summer', 'Medicare annual enrollment prep'],
            impact: 'Increase'
        },
        { // Oct
            reason: 'Rising toward year-end',
            drivers: ['Patients hitting out-of-pocket max', 'Pre-winter elective procedures', 'Flu shot season begins'],
            impact: 'Increase'
        },
        { // Nov
            reason: 'Holiday season impact',
            drivers: ['Increased ER visits (holidays)', 'Year-end procedure rush', 'Respiratory illness season'],
            impact: 'Stable'
        },
        { // Dec
            reason: 'Year-end stabilization',
            drivers: ['Benefit maximization behavior', 'Provider network management', 'Offset by holiday closures'],
            impact: 'Stable'
        }
    ];

    performanceTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Actual PMPM',
                data: [862, 858, 851, 847, 845, 843, 840, 838, 842, 845, 847, 847],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#667eea',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            }, {
                label: 'Benchmark PMPM',
                data: [870, 869, 868, 867, 866, 865, 864, 863, 863, 866, 866, 867],
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.4,
                fill: true,
                borderDash: [5, 5],
                pointRadius: 4,
                pointHoverRadius: 6
            }]
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
                },
                datalabels: {
                    display: function(context) {
                        // Only show labels for every 3rd point to avoid clutter
                        return context.dataIndex % 3 === 0;
                    },
                    color: function(context) {
                        return context.datasetIndex === 0 ? '#667eea' : '#e74c3c';
                    },
                    font: { weight: 'bold', size: 10 },
                    anchor: 'end',
                    align: 'top',
                    offset: 2,
                    formatter: function(value) {
                        return '$' + value;
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(44, 62, 80, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#667eea',
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
                    callbacks: {
                        title: function(context) {
                            return context[0].label + ' 2024 Performance';
                        },
                        afterTitle: function(context) {
                            const monthIndex = context[0].dataIndex;
                            const insight = monthlyInsights[monthIndex];
                            return insight.reason;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += '$' + context.parsed.y.toFixed(2);
                            return label;
                        },
                        afterLabel: function(context) {
                            if (context.datasetIndex === 0) { // Only show for Actual PMPM line
                                const actual = context.parsed.y;
                                const benchmark = context.chart.data.datasets[1].data[context.dataIndex];
                                const variance = ((actual - benchmark) / benchmark * 100).toFixed(1);
                                const varSign = variance > 0 ? '+' : '';
                                return `Variance: ${varSign}${variance}%`;
                            }
                            return '';
                        },
                        footer: function(context) {
                            const monthIndex = context[0].dataIndex;
                            const insight = monthlyInsights[monthIndex];

                            let footer = '\n━━━━━━━━━━━━━━━━━━━━━\nKey Drivers:\n';
                            insight.drivers.forEach((driver, idx) => {
                                footer += `  ${idx + 1}. ${driver}\n`;
                            });
                            footer += '\nImpact: ' + insight.impact;
                            return footer;
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
                        text: 'Month'
                    }
                }
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

    costPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Inpatient Facility', 'Outpatient Services', 'Professional Services', 'Pharmacy', 'Post-Acute Care'],
            datasets: [{
                data: [38.5, 29.5, 18.4, 10.0, 3.6],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 11 },
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
            <div class="alert-box" style="background: #e8f8f5; border-left-color: #27ae60;">
                <h4 style="color: #1e8449;">🏆 Best Practice Provider</h4>
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
    document.getElementById('proj-savings').textContent = '$' + newSavings.toFixed(1) + 'M';

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

// Geographic Map Visualization
function initializeGeographicMap() {
    const svg = d3.select('#leakage-svg');
    if (!svg.node()) return;

    const width = svg.node().getBoundingClientRect().width || 800;
    const height = 500;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // PCP locations (in-network, attributed patient origin)
    const pcpLocations = [
        { name: 'Atlanta North PCPs', x: 300, y: 180, patients: 12456, type: 'pcp' },
        { name: 'Atlanta South PCPs', x: 280, y: 240, patients: 15234, type: 'pcp' },
        { name: 'Columbus PCPs', x: 180, y: 300, patients: 8923, type: 'pcp' },
        { name: 'Augusta PCPs', x: 450, y: 280, patients: 6734, type: 'pcp' },
        { name: 'Macon PCPs', x: 320, y: 340, patients: 4476, type: 'pcp' }
    ];

    // OON leak destinations (where services are being referred OUT of network)
    const leakDestinations = [
        { name: 'Emory Midtown (Cardio)', x: 310, y: 200, leaked: 8100000, serviceLine: 'Cardiology', fromPCP: 'Augusta PCPs' },
        { name: 'Northside Cardiovascular', x: 290, y: 170, leaked: 5200000, serviceLine: 'Cardiology', fromPCP: 'Atlanta North PCPs' },
        { name: 'Piedmont Heart Institute', x: 270, y: 250, leaked: 6800000, serviceLine: 'Cardiology', fromPCP: 'Atlanta South PCPs' },
        { name: 'Mayo Clinic Jacksonville', x: 520, y: 400, leaked: 4300000, serviceLine: 'Orthopedics', fromPCP: 'Augusta PCPs' },
        { name: 'Atlanta Orthopedic', x: 295, y: 190, leaked: 3900000, serviceLine: 'Orthopedics', fromPCP: 'Atlanta South PCPs' },
        { name: 'Emory Winship Cancer', x: 305, y: 195, leaked: 7200000, serviceLine: 'Oncology', fromPCP: 'Atlanta North PCPs' },
        { name: 'UAB Birmingham', x: 100, y: 280, leaked: 2800000, serviceLine: 'Neurology', fromPCP: 'Columbus PCPs' }
    ];

    // Draw Georgia outline (simplified)
    svg.append('path')
        .attr('d', 'M 100 150 Q 150 120 220 130 L 350 140 Q 450 145 520 180 L 540 250 Q 530 320 480 370 L 380 420 Q 280 440 200 420 L 120 380 Q 80 320 90 250 Z')
        .attr('fill', '#f8f9fa')
        .attr('stroke', '#95a5a6')
        .attr('stroke-width', 2);

    // Create a group for zoomable content
    const zoomGroup = svg.append('g');

    // Draw flow lines from PCPs to leak destinations (heat map style)
    leakDestinations.forEach(dest => {
        const sourcePCP = pcpLocations.find(p => p.name === dest.fromPCP);
        if (sourcePCP) {
            // Calculate heat intensity based on leaked amount
            const maxLeak = Math.max(...leakDestinations.map(d => d.leaked));
            const intensity = dest.leaked / maxLeak;
            const strokeWidth = 2 + intensity * 10;
            const opacity = 0.3 + intensity * 0.5;

            // Draw curved path from PCP to leak destination
            const midX = (sourcePCP.x + dest.x) / 2;
            const midY = (sourcePCP.y + dest.y) / 2 - 40;

            zoomGroup.append('path')
                .attr('d', `M ${sourcePCP.x} ${sourcePCP.y} Q ${midX} ${midY} ${dest.x} ${dest.y}`)
                .attr('stroke', '#e74c3c')
                .attr('stroke-width', strokeWidth)
                .attr('fill', 'none')
                .attr('opacity', opacity)
                .attr('class', 'leak-flow');

            // Add arrow head
            zoomGroup.append('polygon')
                .attr('points', '-5,-3 0,0 -5,3')
                .attr('fill', '#e74c3c')
                .attr('opacity', opacity)
                .attr('transform', `translate(${dest.x}, ${dest.y}) rotate(${Math.atan2(dest.y - midY, dest.x - midX) * 180 / Math.PI})`);
        }
    });

    // Add PCP location circles (green - in network)
    const pcpGroups = zoomGroup.selectAll('.pcp-location')
        .data(pcpLocations)
        .enter()
        .append('g')
        .attr('class', 'pcp-location')
        .attr('transform', d => `translate(${d.x}, ${d.y})`);

    pcpGroups.append('circle')
        .attr('r', d => 8 + Math.sqrt(d.patients) / 30)
        .attr('fill', '#27ae60')
        .attr('opacity', 0.7)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    pcpGroups.append('text')
        .attr('dy', -15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', '#27ae60')
        .text(d => d.name);

    // Add leak destination circles (red - out of network) with heat map intensity
    const leakGroups = zoomGroup.selectAll('.leak-destination')
        .data(leakDestinations)
        .enter()
        .append('g')
        .attr('class', 'leak-destination')
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .style('cursor', 'pointer')
        .on('click', function(event, d) {
            showLeakDetailModal(d);
        });

    leakGroups.append('circle')
        .attr('r', d => 6 + Math.sqrt(d.leaked) / 600)
        .attr('fill', d => {
            const intensity = d.leaked / Math.max(...leakDestinations.map(l => l.leaked));
            if (intensity > 0.7) return '#c0392b';  // Dark red for high leak
            if (intensity > 0.4) return '#e74c3c';  // Medium red
            return '#e67e22';  // Orange for lower leak
        })
        .attr('opacity', 0.8)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    leakGroups.append('text')
        .attr('dy', d => 6 + Math.sqrt(d.leaked) / 600 + 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('fill', '#2c3e50')
        .text(d => d.name);

    leakGroups.append('text')
        .attr('dy', d => 6 + Math.sqrt(d.leaked) / 600 + 27)
        .attr('text-anchor', 'middle')
        .attr('font-size', '8px')
        .attr('fill', '#e74c3c')
        .text(d => '$' + (d.leaked / 1000000).toFixed(1) + 'M');

    // Add legend
    const legend = svg.append('g')
        .attr('transform', 'translate(620, 20)');

    legend.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 6)
        .attr('fill', '#27ae60');

    legend.append('text')
        .attr('x', 12)
        .attr('y', 4)
        .attr('font-size', '11px')
        .text('PCP Locations (In-Network)');

    legend.append('circle')
        .attr('cx', 0)
        .attr('cy', 25)
        .attr('r', 6)
        .attr('fill', '#e74c3c');

    legend.append('text')
        .attr('x', 12)
        .attr('y', 29)
        .attr('font-size', '11px')
        .text('Leak Destinations (OON)');

    legend.append('line')
        .attr('x1', -5)
        .attr('y1', 50)
        .attr('x2', 5)
        .attr('y2', 50)
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 3)
        .attr('opacity', 0.6);

    legend.append('text')
        .attr('x', 12)
        .attr('y', 54)
        .attr('font-size', '11px')
        .text('Referral Flow (thickness = $)');

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 4])
        .on('zoom', (event) => {
            zoomGroup.attr('transform', event.transform);
        });

    svg.call(zoom);
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

    const providerData = [
        { provider: 'Piedmont Fayette', lives: 5123, totalED: 1437, avoidableED: 492, avoidablePct: 34.2, costPerVisit: 1247, savingsPotential: 613404 },
        { provider: 'Piedmont Newnan', lives: 4567, totalED: 1279, avoidableED: 428, avoidablePct: 33.5, costPerVisit: 1198, savingsPotential: 512744 },
        { provider: 'Piedmont Henry', lives: 3234, totalED: 906, avoidableED: 299, avoidablePct: 33.0, costPerVisit: 1231, savingsPotential: 368069 },
        { provider: 'Community Providers', lives: 2310, totalED: 647, avoidableED: 207, avoidablePct: 32.0, costPerVisit: 1219, savingsPotential: 252333 }
    ];

    const totalSavings = providerData.reduce((sum, p) => sum + p.savingsPotential, 0);
    const totalAvoidable = providerData.reduce((sum, p) => sum + p.avoidableED, 0);
    const totalEDVisits = providerData.reduce((sum, p) => sum + p.totalED, 0);
    const avgAvoidablePct = (providerData.reduce((sum, p) => sum + p.avoidablePct, 0) / providerData.length).toFixed(1);
    const avgCostPerVisit = Math.round(providerData.reduce((sum, p) => sum + p.costPerVisit, 0) / providerData.length);
    const diversionRate = 0.65; // 65% can be diverted to urgent care
    const diversionSavings = Math.round(totalSavings * diversionRate);

    let modalBody = `
        <h2>${marketName} - Avoidable ED Cost Opportunity</h2>
        <p class="provider-summary">Provider-level analysis showing savings from diverting avoidable ED visits to lower-cost settings</p>

        <!-- Reference Values Bar -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; border-left: 4px solid #e74c3c;">
            <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
                <div>
                    <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Reference Values</div>
                </div>
                <div style="display: flex; gap: 2.5rem; flex-wrap: wrap;">
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Avg ED Cost/Visit:</span>
                        <span style="font-weight: 700; color: #e74c3c; margin-left: 0.5rem; font-size: 1.1rem;">$${avgCostPerVisit.toLocaleString()}</span>
                    </div>
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Urgent Care Cost:</span>
                        <span style="font-weight: 700; color: #27ae60; margin-left: 0.5rem; font-size: 1.1rem;">~$150</span>
                    </div>
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Diversion Rate:</span>
                        <span style="font-weight: 700; color: #3498db; margin-left: 0.5rem; font-size: 1.1rem;">65%</span>
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
                        Formula: Avoidable × Cost/Visit
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
                <span style="font-size: 1.2rem;">📊</span> Savings Calculation Breakdown
            </h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Provider</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Total ED</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Avoidable</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">% Avoidable</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Cost/Visit</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Calculation</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #d4edda;">Savings<br>Potential</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${providerData.map(p => `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #eee;"><strong>${p.provider}</strong></td>
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
                        </tr>
                        <tr style="background: #d4edda;">
                            <td colspan="6" style="padding: 0.75rem; font-weight: 600; color: #155724;">
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

        <div class="alert-box success" style="margin-top: 1rem;">
            <h4>Intervention Strategy</h4>
            <ul>
                <li><strong>Target Providers:</strong> Focus on ${providerData[0].provider} and ${providerData[1].provider} for greatest impact ($${(providerData[0].savingsPotential + providerData[1].savingsPotential).toLocaleString()} combined)</li>
                <li><strong>Patient Engagement:</strong> Activate MyChart for top utilizers and promote telehealth options</li>
                <li><strong>Network Strategy:</strong> Expand urgent care hours and locations in high-utilization areas</li>
            </ul>
        </div>
    `;

    showModal(modalBody);
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
        }
    };

    const data = pcpData[pcpId];
    if (!data) {
        alert('Sankey diagram for PCP: ' + pcpId);
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
    const providerNames = {
        'johnson': 'Dr. Johnson',
        'anderson': 'Dr. Anderson',
        'brown': 'Dr. Brown'
    };

    const providerName = providerNames[providerId] || providerId;

    // Generate patient-level HCC gap data
    const patients = [
        {
            mrn: 'MRN384729',
            firstName: 'Robert',
            lastName: 'Williams',
            age: 72,
            awvCompleted: true,
            awvDate: '2024-08-15',
            openHCCs: ['HCC 85 (CHF)', 'HCC 111 (COPD)'],
            suspectedHCCs: ['HCC 19 (Diabetes with complications)'],
            nextAppt: '2024-11-22',
            rafCurrent: 2.84,
            rafPotential: 3.12,
            revenueOpp: 3200
        },
        {
            mrn: 'MRN291847',
            firstName: 'Mary',
            lastName: 'Thompson',
            age: 68,
            awvCompleted: false,
            awvDate: null,
            openHCCs: ['HCC 18 (Diabetes)'],
            suspectedHCCs: ['HCC 108 (Vascular Disease)', 'HCC 111 (COPD)'],
            nextAppt: '2024-12-05',
            rafCurrent: 1.92,
            rafPotential: 2.45,
            revenueOpp: 6200
        },
        {
            mrn: 'MRN573921',
            firstName: 'James',
            lastName: 'Davis',
            age: 75,
            awvCompleted: true,
            awvDate: '2024-09-03',
            openHCCs: ['HCC 85 (CHF)', 'HCC 18 (Diabetes)'],
            suspectedHCCs: ['HCC 88 (Arrhythmia)'],
            nextAppt: '2024-11-18',
            rafCurrent: 3.15,
            rafPotential: 3.48,
            revenueOpp: 3900
        },
        {
            mrn: 'MRN684012',
            firstName: 'Patricia',
            lastName: 'Garcia',
            age: 70,
            awvCompleted: false,
            awvDate: null,
            openHCCs: ['HCC 111 (COPD)'],
            suspectedHCCs: ['HCC 85 (CHF)', 'HCC 59 (Major Depression)'],
            nextAppt: 'Not scheduled',
            rafCurrent: 1.67,
            rafPotential: 2.34,
            revenueOpp: 7800
        },
        {
            mrn: 'MRN492847',
            firstName: 'Linda',
            lastName: 'Martinez',
            age: 66,
            awvCompleted: true,
            awvDate: '2024-07-22',
            openHCCs: ['HCC 18 (Diabetes)', 'HCC 23 (Obesity)'],
            suspectedHCCs: ['HCC 19 (Diabetes with complications)'],
            nextAppt: '2024-11-29',
            rafCurrent: 1.82,
            rafPotential: 2.08,
            revenueOpp: 3000
        }
    ];

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
            <div class="kpi-card" style="background: white; border: 1px solid #e0e0e0;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">
                    AWV Completion
                </div>
                <div class="kpi-value" style="font-size: 1.8rem; font-weight: 700; color: ${awvCompleteCount >= 4 ? '#27ae60' : '#f39c12'}; margin: 0.5rem 0;">
                    ${((awvCompleteCount / patients.length) * 100).toFixed(0)}%
                </div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #eee;">
                    ${awvCompleteCount} of ${patients.length} patients
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
            <div class="kpi-card" style="background: white; border: 1px solid #e0e0e0;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">
                    Not Scheduled
                </div>
                <div class="kpi-value" style="font-size: 1.8rem; font-weight: 700; color: ${patientsNotScheduled > 0 ? '#e74c3c' : '#27ae60'}; margin: 0.5rem 0;">
                    ${patientsNotScheduled}
                </div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #eee;">
                    Priority for outreach
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

// Make functions globally available for onclick handlers in HTML
window.drillDownMarket = drillDownMarket;
window.showMeasureDashboard = showMeasureDashboard;
window.drillDownEDMarket = drillDownEDMarket;
window.setLeakageView = setLeakageView;
window.toggleNetworkView = toggleNetworkView;
window.drillDownPCPLeakage = drillDownPCPLeakage;
window.drillDownHCC = drillDownHCC;
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
