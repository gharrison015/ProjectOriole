// Global variables
let leakagePieChart = null;
let costPieChart = null;
let performanceTrendChart = null;
let monteCarloChart = null;
let waterfallChart = null;
let qualityTrendChart = null;
let costTrendChart = null;
let rafDistChart = null;
let episodeCostChart = null;
let currentLeakageView = 'all';
let showingOONOnly = false;

// Helper function to add disclaimer to CSV exports
function generateCSVWithDisclaimer(headers, rows) {
    const today = new Date().toLocaleDateString();
    let csvContent = '';
    csvContent += '*** SYNTHETIC DATA - NOT REAL PHI ***\n';
    csvContent += `Generated: ${today}\n`;
    csvContent += 'For demonstration purposes only - All patient data is artificially generated\n';
    csvContent += '\n';
    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.join(',') + '\n';
    });
    return csvContent;
}

// Terms of Use Modal - Show on first visit
function checkAndShowTerms() {
    const hasAcceptedTerms = localStorage.getItem('demoTermsAccepted');
    if (!hasAcceptedTerms) {
        const termsModal = document.getElementById('terms-modal');
        if (termsModal) {
            termsModal.style.display = 'flex';
        }
    }
}

function acceptTerms() {
    localStorage.setItem('demoTermsAccepted', 'true');
    localStorage.setItem('demoTermsAcceptedDate', new Date().toISOString());
    const termsModal = document.getElementById('terms-modal');
    if (termsModal) {
        termsModal.style.display = 'none';
    }
}

// Make acceptTerms available globally
window.acceptTerms = acceptTerms;

// Tab Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Check and show terms modal if needed
    checkAndShowTerms();

    initializeTabs();
    initializeCharts();
    initPerformanceOverviewDefaults();
    initMonteCarloScenarioToggle();
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
}

// Helper function to format date as "Nov 22" or "Dec 5"
function formatDateShort(dateString) {
    if (!dateString || dateString === 'Not scheduled') return 'Not scheduled';
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Generate a DOB string from age
function generateDOB(age) {
    const birthYear = new Date().getFullYear() - age;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${birthYear}`;
}

// Generate a random last visit date within the past 6 months
function generateLastVisit() {
    const daysAgo = Math.floor(Math.random() * 180) + 1;
    const lastVisitDate = new Date();
    lastVisitDate.setDate(lastVisitDate.getDate() - daysAgo);
    return lastVisitDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
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
                    if (tabName === 'leakage') {
                        if (leakagePieChart) {
                            leakagePieChart.resize();
                        }
                        // Update facilities table to ensure filters are applied correctly
                        updateFacilitiesTable();
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
    initWaterfallChart();
    initLeakagePieChart();
    initCostPieChart();
    initQualityTrendChart();
    initCostTrendChart();
    initRAFDistChart();
    initEpisodeCostChart();
}

function initPerformanceTrendChart(selectedYear = 'PY2025') {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    if (performanceTrendChart) {
        performanceTrendChart.destroy();
    }

    // Update chart note visibility based on selected year
    const chartNote = document.getElementById('pmpm-chart-note');
    if (chartNote) {
        chartNote.classList.toggle('hidden', selectedYear !== 'PY2025');
    }

    let datasets = [];
    let tooltipBorderColor = '#667eea';

    if (selectedYear === 'PY2025') {
        // PY2025 data - Jan-Oct are actual (solid), Nov-Dec include IBNR (dotted)
        const py2025ActualData = [862, 858, 851, 847, 845, 843, 840, 838, 842, 845, null, null];
        const py2025IBNRData = [null, null, null, null, null, null, null, null, null, 845, 847, 847];
        const py2025Benchmark = [858, 858, 858, 858, 858, 858, 858, 858, 858, 858, 858, 858];

        datasets = [
            {
                label: 'PY2025 Actual PMPM',
                data: py2025ActualData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                borderWidth: 3,
                spanGaps: false
            },
            {
                label: 'PY2025 IBNR PMPM',
                data: py2025IBNRData,
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
                borderWidth: 2,
                spanGaps: true
            },
            {
                label: 'PY2025 Benchmark',
                data: py2025Benchmark,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.05)',
                tension: 0,
                fill: false,
                borderDash: [3, 3],
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2
            }
        ];
        tooltipBorderColor = '#667eea';
    } else {
        // PY2026 data - Only January has actual data (one green dot)
        const py2026ActualData = [855, null, null, null, null, null, null, null, null, null, null, null];
        const py2026Benchmark = [864, 864, 864, 864, 864, 864, 864, 864, 864, 864, 864, 864];

        datasets = [
            {
                label: 'PY2026 Actual PMPM',
                data: py2026ActualData,
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.15)',
                tension: 0.4,
                fill: false,
                pointRadius: 7,
                pointHoverRadius: 10,
                pointBackgroundColor: '#27ae60',
                pointBorderColor: '#fff',
                pointBorderWidth: 3,
                borderWidth: 3,
                spanGaps: false
            },
            {
                label: 'PY2026 Benchmark',
                data: py2026Benchmark,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.05)',
                tension: 0,
                fill: false,
                borderDash: [3, 3],
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2
            }
        ];
        tooltipBorderColor = '#27ae60';
    }

    performanceTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: datasets
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
                        font: { size: 11 },
                        filter: function(item) {
                            // Don't show IBNR in legend separately, it's part of PY2025
                            return !item.text.includes('IBNR');
                        }
                    }
                },
                datalabels: {
                    display: function(context) {
                        const datasetIndex = context.datasetIndex;
                        const dataIndex = context.dataIndex;
                        const value = context.dataset.data[dataIndex];
                        if (value === null) return false;

                        if (selectedYear === 'PY2025') {
                            // Show labels for Jan, Jun, Oct (actual) and Dec (IBNR)
                            if (datasetIndex === 0 && (dataIndex === 0 || dataIndex === 5 || dataIndex === 9)) return true;
                            if (datasetIndex === 1 && dataIndex === 11) return true;
                        } else {
                            // PY2026 - show label for January only
                            if (datasetIndex === 0 && dataIndex === 0) return true;
                        }
                        return false;
                    },
                    color: selectedYear === 'PY2025' ? '#667eea' : '#27ae60',
                    font: { weight: 'bold', size: 11 },
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
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
                    borderColor: tooltipBorderColor,
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
                            return month + ' ' + selectedYear;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (context.parsed.y === null) return null;
                            if (label) {
                                label += ': ';
                            }
                            label += '$' + context.parsed.y.toFixed(2);
                            // Add indicator for IBNR
                            if (context.dataset.label && context.dataset.label.includes('IBNR')) {
                                label += ' (IBNR adjusted)';
                            }
                            return label;
                        },
                        afterBody: function(context) {
                            const dataIndex = context[0].dataIndex;
                            let result = [];

                            if (selectedYear === 'PY2025') {
                                const actualData = datasets[0].data;
                                const ibnrData = datasets[1].data;
                                const benchmarkData = datasets[2].data;

                                let pmpmValue = actualData[dataIndex];
                                if (pmpmValue === null) pmpmValue = ibnrData[dataIndex];

                                if (pmpmValue !== null && benchmarkData[dataIndex]) {
                                    const vsBenchmark = ((pmpmValue - benchmarkData[dataIndex]) / benchmarkData[dataIndex] * 100).toFixed(1);
                                    const sign = vsBenchmark > 0 ? '+' : '';
                                    result.push(`\nvs Benchmark: ${sign}${vsBenchmark}%`);
                                }
                            } else {
                                const actualData = datasets[0].data;
                                const benchmarkData = datasets[1].data;

                                if (actualData[dataIndex] !== null && benchmarkData[dataIndex]) {
                                    const vsBenchmark = ((actualData[dataIndex] - benchmarkData[dataIndex]) / benchmarkData[dataIndex] * 100).toFixed(1);
                                    const sign = vsBenchmark > 0 ? '+' : '';
                                    result.push(`\nvs Benchmark: ${sign}${vsBenchmark}%`);
                                }
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
                        text: 'Month'
                    }
                }
            }
        }
    });
}

// Initialize Performance Overview with default year (PY2025)
function initPerformanceOverviewDefaults() {
    // Initialize market performance table with PY2025 data
    updateMarketPerformanceTable('PY2025');
}

// Update Performance Overview KPIs based on selected year
function updatePerformanceKPIs(selectedYear) {
    const pmpmValue = document.getElementById('perf-pmpm-value');
    const pmpmChange = document.getElementById('perf-pmpm-change');
    const savingsValue = document.getElementById('perf-savings-value');
    const savingsChange = document.getElementById('perf-savings-change');
    const qualityValue = document.getElementById('perf-quality-value');
    const qualityChange = document.getElementById('perf-quality-change');
    const leakageValue = document.getElementById('perf-leakage-value');
    const leakageChange = document.getElementById('perf-leakage-change');
    const kpiNote = document.getElementById('performance-kpi-note');

    if (selectedYear === 'PY2025') {
        // PY2025 values (full year with IBNR)
        if (pmpmValue) pmpmValue.textContent = '$847.32';
        if (pmpmChange) {
            pmpmChange.textContent = '↓ 1.2% vs Benchmark ($858)';
            pmpmChange.className = 'kpi-change positive';
        }
        if (savingsValue) savingsValue.textContent = '$11.2M';
        if (savingsChange) {
            savingsChange.textContent = '↑ $700K vs Target ($10.5M)';
            savingsChange.className = 'kpi-change positive';
        }
        if (qualityValue) qualityValue.textContent = '87.4%';
        if (qualityChange) {
            qualityChange.textContent = '↑ 5.2 pts vs National (82.1%)';
            qualityChange.className = 'kpi-change positive';
        }
        if (leakageValue) leakageValue.textContent = '23.7%';
        if (leakageChange) {
            leakageChange.textContent = '$4.2M Opportunity';
            leakageChange.className = 'kpi-change negative';
        }
        if (kpiNote) kpiNote.classList.remove('hidden');
    } else {
        // PY2026 values (1 month of data - January only)
        if (pmpmValue) pmpmValue.textContent = '$855.00';
        if (pmpmChange) {
            pmpmChange.textContent = '↓ 1.0% vs Benchmark ($864)';
            pmpmChange.className = 'kpi-change positive';
        }
        // Projected savings based on 1 month trending
        if (savingsValue) savingsValue.textContent = '$9.2M';
        if (savingsChange) {
            savingsChange.textContent = 'Projected (1 mo. data)';
            savingsChange.className = 'kpi-change neutral';
        }
        // Quality score preliminary (less claims data for quality measures)
        if (qualityValue) qualityValue.textContent = '81.5%';
        if (qualityChange) {
            qualityChange.textContent = 'Preliminary (eCQM submissions)';
            qualityChange.className = 'kpi-change neutral';
        }
        // Network leakage with limited data
        if (leakageValue) leakageValue.textContent = '20.8%';
        if (leakageChange) {
            leakageChange.textContent = '$340K Opportunity (1 mo.)';
            leakageChange.className = 'kpi-change negative';
        }
        if (kpiNote) kpiNote.classList.add('hidden');
    }
}

// Market Performance Data by Year
const marketPerformanceData = {
    PY2025: [
        { region: 'Atlanta North', id: 'atlanta-north', lives: '12,456', pmpm: '$823.45', vsBenchmark: '-$43.05 (-5.0%)', vsBenchmarkClass: 'good', quality: '89.2%', leakage: '18.3%', leakageClass: 'good' },
        { region: 'Atlanta South', id: 'atlanta-south', lives: '15,234', pmpm: '$871.22', vsBenchmark: '+$4.72 (+0.5%)', vsBenchmarkClass: 'warning', quality: '86.1%', leakage: '27.4%', leakageClass: 'bad' },
        { region: 'Columbus', id: 'columbus', lives: '8,923', pmpm: '$834.67', vsBenchmark: '-$31.83 (-3.7%)', vsBenchmarkClass: 'good', quality: '88.5%', leakage: '21.2%', leakageClass: '' },
        { region: 'Augusta', id: 'augusta', lives: '6,734', pmpm: '$892.18', vsBenchmark: '+$25.68 (+3.0%)', vsBenchmarkClass: 'bad', quality: '84.3%', leakage: '31.8%', leakageClass: 'bad' },
        { region: 'Macon', id: 'macon', lives: '4,476', pmpm: '$851.34', vsBenchmark: '-$15.16 (-1.7%)', vsBenchmarkClass: 'warning', quality: '85.9%', leakage: '19.6%', leakageClass: '' }
    ],
    PY2026: [
        { region: 'Atlanta North', id: 'atlanta-north', lives: '12,612', pmpm: '$831.20', vsBenchmark: '-$32.80 (-3.8%)', vsBenchmarkClass: 'good', quality: '84.1%', leakage: '17.2%', leakageClass: 'good' },
        { region: 'Atlanta South', id: 'atlanta-south', lives: '15,389', pmpm: '$878.45', vsBenchmark: '+$14.45 (+1.7%)', vsBenchmarkClass: 'warning', quality: '80.3%', leakage: '25.1%', leakageClass: 'bad' },
        { region: 'Columbus', id: 'columbus', lives: '9,045', pmpm: '$842.10', vsBenchmark: '-$21.90 (-2.5%)', vsBenchmarkClass: 'good', quality: '82.7%', leakage: '19.8%', leakageClass: '' },
        { region: 'Augusta', id: 'augusta', lives: '6,801', pmpm: '$898.32', vsBenchmark: '+$34.32 (+4.0%)', vsBenchmarkClass: 'bad', quality: '78.5%', leakage: '29.4%', leakageClass: 'bad' },
        { region: 'Macon', id: 'macon', lives: '4,521', pmpm: '$858.90', vsBenchmark: '-$5.10 (-0.6%)', vsBenchmarkClass: 'warning', quality: '80.8%', leakage: '18.2%', leakageClass: '' }
    ]
};

// Update Market Performance Table based on selected year
function updateMarketPerformanceTable(selectedYear) {
    const tbody = document.getElementById('market-performance-tbody');
    if (!tbody) return;

    const data = marketPerformanceData[selectedYear] || marketPerformanceData.PY2025;

    tbody.innerHTML = data.map(row => `
        <tr onclick="drillDownMarket('${row.id}')" class="clickable">
            <td><strong>${row.region}</strong></td>
            <td>${row.lives}</td>
            <td>${row.pmpm}</td>
            <td class="${row.vsBenchmarkClass}">${row.vsBenchmark}</td>
            <td>${row.quality}</td>
            <td class="${row.leakageClass}">${row.leakage}</td>
            <td><button class="btn-small">View Details →</button></td>
        </tr>
    `).join('');
}

// Global year switching function for Performance Overview tab
function switchPerformanceYear(year) {
    // Update toggle button active states
    const toggleBtns = document.querySelectorAll('#performance-year-selector .year-toggle-btn');
    toggleBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.year === year);
    });

    // Update chart
    initPerformanceTrendChart(year);

    // Update KPIs
    updatePerformanceKPIs(year);

    // Update market performance table
    updateMarketPerformanceTable(year);
}

// Make switchPerformanceYear available globally for onclick handler
window.switchPerformanceYear = switchPerformanceYear;

// Monte Carlo scenario descriptions with confidence intervals
// CI values calculated using normal distribution: 2.5% and 97.5% percentiles (mean ± 1.96*stdDev)
// Benchmark is $498.8M, so spend = benchmark - savings
const monteCarloScenarios = {
    1: {
        name: 'Base Case',
        description: '<strong>Base Case:</strong> No adjustment for utilization or volume changes. Uses current membership and historical utilization patterns.',
        mean: 9.6,
        stdDev: 3.2,
        color: 'rgba(102, 126, 234, 0.6)',
        borderColor: '#667eea',
        // CI values for display
        ciLowSavings: '-$2.1M',      // 2.5% percentile (worst case)
        ciLowSpend: '$500.9M',
        ciMeanSavings: '$9.6M',      // Mean value
        ciMeanSpend: '$489.2M',
        ciHighSavings: '$20.4M',     // 97.5% percentile (best case)
        ciHighSpend: '$478.4M',
        // Numeric values for chart annotations
        ciLow: -2.1,
        ciHigh: 20.4
    },
    2: {
        name: 'Volume Adjustment',
        description: '<strong>Volume Adjustment:</strong> Varies the number of attributed lives from -5% to +10%, simulating membership fluctuations throughout the performance year.',
        mean: 8.8,
        stdDev: 4.1,
        color: 'rgba(52, 152, 219, 0.6)',
        borderColor: '#3498db',
        ciLowSavings: '-$5.2M',
        ciLowSpend: '$504.0M',
        ciMeanSavings: '$8.8M',
        ciMeanSpend: '$490.0M',
        ciHighSavings: '$22.8M',
        ciHighSpend: '$476.0M',
        ciLow: -5.2,
        ciHigh: 22.8
    },
    3: {
        name: 'Utilization Variation',
        description: '<strong>Utilization Variation:</strong> Keeps lives constant and varies utilization from -8% to +5%, modeling the impact of care management initiatives.',
        mean: 10.4,
        stdDev: 3.8,
        color: 'rgba(39, 174, 96, 0.6)',
        borderColor: '#27ae60',
        ciLowSavings: '-$0.8M',
        ciLowSpend: '$499.6M',
        ciMeanSavings: '$10.4M',
        ciMeanSpend: '$488.4M',
        ciHighSavings: '$21.6M',
        ciHighSpend: '$477.2M',
        ciLow: -0.8,
        ciHigh: 21.6
    },
    4: {
        name: 'Risk Corridor (2%)',
        description: '<strong>Risk Corridor:</strong> Applies a 2% risk corridor, limiting both upside gains and downside losses to model symmetric risk sharing.',
        mean: 7.2,
        stdDev: 2.4,
        color: 'rgba(155, 89, 182, 0.6)',
        borderColor: '#9b59b6',
        ciLowSavings: '$0.2M',
        ciLowSpend: '$498.6M',
        ciMeanSavings: '$7.2M',
        ciMeanSpend: '$491.6M',
        ciHighSavings: '$14.2M',
        ciHighSpend: '$484.6M',
        ciLow: 0.2,
        ciHigh: 14.2
    }
};

function initMonteCarloChart(scenario = 1) {
    const ctx = document.getElementById('monteChart');
    if (!ctx) return;

    if (monteCarloChart) {
        monteCarloChart.destroy();
    }

    const scenarioConfig = monteCarloScenarios[scenario];

    // Update scenario description
    const descEl = document.getElementById('scenario-description');
    if (descEl) {
        descEl.innerHTML = scenarioConfig.description;
    }

    // Calculate dynamic range based on P2.5 and P97.5 with 10% buffer
    const p25 = scenarioConfig.ciLow;
    const p975 = scenarioConfig.ciHigh;
    const range = p975 - p25;
    const buffer = range * 0.1;
    const minValue = Math.floor((p25 - buffer) * 2) / 2; // Round down to nearest 0.5
    const maxValue = Math.ceil((p975 + buffer) * 2) / 2; // Round up to nearest 0.5
    const binWidth = 0.6;
    const bins = Math.ceil((maxValue - minValue) / binWidth);
    const data = [];
    const labels = [];

    for (let i = 0; i < bins; i++) {
        const x = minValue + (i * binWidth) + (binWidth / 2);
        const y = Math.exp(-0.5 * Math.pow((x - scenarioConfig.mean) / scenarioConfig.stdDev, 2)) * 35;
        data.push(y);

        const labelValue = minValue + (i * binWidth);
        if (labelValue < 0) {
            labels.push('-$' + Math.abs(labelValue).toFixed(1) + 'M');
        } else {
            labels.push('$' + labelValue.toFixed(1) + 'M');
        }
    }

    // Color bars based on positive/negative
    const backgroundColors = data.map((_, i) => {
        const value = minValue + (i * binWidth);
        if (value < 0) {
            return 'rgba(231, 76, 60, 0.5)';
        }
        return scenarioConfig.color;
    });

    const borderColors = data.map((_, i) => {
        const value = minValue + (i * binWidth);
        if (value < 0) {
            return '#e74c3c';
        }
        return scenarioConfig.borderColor;
    });

    monteCarloChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequency',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
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
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return context[0].label + ' Shared Savings';
                        },
                        label: function(context) {
                            return 'Probability: ' + context.parsed.y.toFixed(1) + '%';
                        }
                    }
                },
                annotation: {
                    annotations: {
                        meanLine: {
                            type: 'line',
                            xMin: (scenarioConfig.mean - minValue) / binWidth,
                            xMax: (scenarioConfig.mean - minValue) / binWidth,
                            borderColor: '#2c3e50',
                            borderWidth: 2,
                            label: {
                                display: true,
                                content: 'Mean: $' + scenarioConfig.mean.toFixed(1) + 'M',
                                position: 'start',
                                backgroundColor: 'rgba(44, 62, 80, 0.8)',
                                color: '#fff',
                                font: { size: 10, weight: 'bold' }
                            }
                        },
                        p25Line: {
                            type: 'line',
                            xMin: (scenarioConfig.ciLow - minValue) / binWidth,
                            xMax: (scenarioConfig.ciLow - minValue) / binWidth,
                            borderColor: '#e74c3c',
                            borderWidth: 2,
                            borderDash: [6, 4],
                            label: {
                                display: true,
                                content: 'P2.5',
                                position: 'start',
                                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                                color: '#fff',
                                font: { size: 10, weight: 'bold' }
                            }
                        },
                        p975Line: {
                            type: 'line',
                            xMin: (scenarioConfig.ciHigh - minValue) / binWidth,
                            xMax: (scenarioConfig.ciHigh - minValue) / binWidth,
                            borderColor: '#27ae60',
                            borderWidth: 2,
                            borderDash: [6, 4],
                            label: {
                                display: true,
                                content: 'P97.5',
                                position: 'start',
                                backgroundColor: 'rgba(39, 174, 96, 0.8)',
                                color: '#fff',
                                font: { size: 10, weight: 'bold' }
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Projected Shared Savings (PY2026)'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 12
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

// Initialize Monte Carlo scenario toggle
function initMonteCarloScenarioToggle() {
    const toggleBtns = document.querySelectorAll('.scenario-toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            toggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const scenario = parseInt(this.dataset.scenario);
            initMonteCarloChart(scenario);
            updateConfidenceIntervals(scenario);
        });
    });
}

// Update confidence interval display based on scenario
function updateConfidenceIntervals(scenario) {
    const config = monteCarloScenarios[scenario];
    if (!config) return;

    // Update CI values
    const ciLowSavings = document.getElementById('ci-low-savings');
    const ciLowSpend = document.getElementById('ci-low-spend');
    const ciMeanSavings = document.getElementById('ci-mean-savings');
    const ciMeanSpend = document.getElementById('ci-mean-spend');
    const ciHighSavings = document.getElementById('ci-high-savings');
    const ciHighSpend = document.getElementById('ci-high-spend');

    if (ciLowSavings) ciLowSavings.textContent = config.ciLowSavings;
    if (ciLowSpend) ciLowSpend.textContent = config.ciLowSpend;
    if (ciMeanSavings) ciMeanSavings.textContent = config.ciMeanSavings;
    if (ciMeanSpend) ciMeanSpend.textContent = config.ciMeanSpend;
    if (ciHighSavings) ciHighSavings.textContent = config.ciHighSavings;
    if (ciHighSpend) ciHighSpend.textContent = config.ciHighSpend;
}

// Waterfall Chart - Shared Savings Bridge
function initWaterfallChart() {
    const ctx = document.getElementById('waterfallChart');
    if (!ctx) return;

    if (waterfallChart) {
        waterfallChart.destroy();
    }

    // Simplified waterfall with cleaner labels
    const labels = ['Base Benchmark', 'Risk Adj.', 'Adjusted Target', 'Medical Spend', 'Gross Savings', 'CMS Share', 'Net Earned'];
    const displayValues = [513.2, -14.4, 498.8, -489.2, 9.6, -5.7, 3.9];
    const types = ['start', 'decrease', 'subtotal', 'decrease', 'increase', 'decrease', 'end'];

    // Calculate bar positions for waterfall effect
    const barData = [];
    const baseData = [];
    let running = 0;

    types.forEach((type, i) => {
        const val = displayValues[i];
        if (type === 'start') {
            baseData.push(0);
            barData.push(val);
            running = val;
        } else if (type === 'subtotal' || type === 'end') {
            baseData.push(0);
            barData.push(val);
            running = val;
        } else if (type === 'decrease') {
            const newRunning = running + val;
            baseData.push(newRunning);
            barData.push(Math.abs(val));
            running = newRunning;
        } else if (type === 'increase') {
            baseData.push(running);
            barData.push(val);
            running = running + val;
        }
    });

    // Color scheme
    const barColors = types.map((type, i) => {
        if (type === 'start') return '#6c757d';
        if (type === 'subtotal') return '#3498db';
        if (type === 'end') return '#27ae60';
        if (type === 'decrease') return '#e74c3c';
        if (type === 'increase') return '#27ae60';
        return '#6c757d';
    });

    waterfallChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Base',
                    data: baseData,
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                    barPercentage: 0.7,
                    categoryPercentage: 0.85
                },
                {
                    label: 'Values',
                    data: barData,
                    backgroundColor: barColors,
                    borderColor: barColors.map(c => c),
                    borderWidth: 0,
                    barPercentage: 0.7,
                    categoryPercentage: 0.85
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: 30 }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: {
                        font: { size: 11, weight: '500' },
                        color: '#2c3e50'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 550,
                    ticks: {
                        callback: (v) => '$' + v + 'M',
                        stepSize: 100,
                        font: { size: 11 },
                        color: '#7f8c8d'
                    },
                    grid: { color: 'rgba(0,0,0,0.06)' }
                }
            },
            plugins: {
                legend: { display: false },
                datalabels: {
                    display: (ctx) => ctx.datasetIndex === 1,
                    color: '#fff',
                    font: { weight: 'bold', size: 11 },
                    anchor: (ctx) => {
                        // Position above bar for Gross Savings, CMS Share, Net Earned
                        const i = ctx.dataIndex;
                        return (i === 4 || i === 5 || i === 6) ? 'end' : 'center';
                    },
                    align: (ctx) => {
                        // Align to top for the three problem columns
                        const i = ctx.dataIndex;
                        return (i === 4 || i === 5 || i === 6) ? 'top' : 'center';
                    },
                    backgroundColor: (ctx) => {
                        // Add transparent grey background for better visibility
                        const i = ctx.dataIndex;
                        return (i === 4 || i === 5 || i === 6) ? 'rgba(0, 0, 0, 0.5)' : 'transparent';
                    },
                    borderRadius: 4,
                    padding: (ctx) => {
                        const i = ctx.dataIndex;
                        return (i === 4 || i === 5 || i === 6) ? { top: 3, bottom: 3, left: 6, right: 6 } : 0;
                    },
                    formatter: (val, ctx) => {
                        const origVal = displayValues[ctx.dataIndex];
                        if (origVal < 0) return '-$' + Math.abs(origVal) + 'M';
                        if (types[ctx.dataIndex] === 'increase') return '+$' + origVal + 'M';
                        return '$' + origVal + 'M';
                    }
                },
                tooltip: {
                    backgroundColor: '#2c3e50',
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    callbacks: {
                        title: (ctx) => ctx[0].label,
                        label: (ctx) => {
                            if (ctx.datasetIndex === 0) return null;
                            const i = ctx.dataIndex;
                            const v = displayValues[i];
                            const descriptions = [
                                'CMS Historical Baseline',
                                'Risk score adjustment (shrinks as HCC recapture increases)',
                                'Benchmark after risk adjustment',
                                'Projected total medical spend for PY2026',
                                'Adjusted Target minus Projected Spend',
                                'CMS 50% share × 82.1% quality multiplier',
                                'Piedmont\'s projected shared savings earned'
                            ];
                            const formatted = v < 0 ? '-$' + Math.abs(v) + 'M' : '$' + v + 'M';
                            return [formatted, descriptions[i]];
                        }
                    }
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

    const data = getLeakageFilteredData();

    // Create gradient fills for modern 3D look
    const canvas = ctx;
    const chartCtx = canvas.getContext('2d');

    // In-Network gradient (green tones)
    const greenGrad = chartCtx.createLinearGradient(0, 0, 0, canvas.height || 280);
    greenGrad.addColorStop(0, '#2ecc71');
    greenGrad.addColorStop(0.5, '#27ae60');
    greenGrad.addColorStop(1, '#1e8449');

    // OON gradient (red tones)
    const redGrad = chartCtx.createLinearGradient(0, 0, 0, canvas.height || 280);
    redGrad.addColorStop(0, '#e74c3c');
    redGrad.addColorStop(0.5, '#c0392b');
    redGrad.addColorStop(1, '#a93226');

    leakagePieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['In-Network', 'Out-of-Network'],
            datasets: [{
                data: [data.inPct, data.oonPct],
                backgroundColor: [greenGrad, redGrad],
                borderWidth: 0,
                hoverBorderWidth: 3,
                hoverBorderColor: '#fff',
                hoverOffset: 8
            },
            // Shadow ring for 3D depth
            {
                data: [data.inPct, data.oonPct],
                backgroundColor: [
                    'rgba(30, 132, 73, 0.3)',
                    'rgba(169, 50, 38, 0.3)'
                ],
                borderWidth: 0,
                weight: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '35%',
            layout: {
                padding: 10
            },
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    display: function(context) {
                        return context.datasetIndex === 0;
                    },
                    color: '#fff',
                    font: { weight: 'bold', size: 13 },
                    anchor: 'center',
                    align: 'center',
                    textShadowColor: 'rgba(0,0,0,0.4)',
                    textShadowBlur: 4,
                    formatter: function(value, context) {
                        const currentData = (leakagePieChart && leakagePieChart._customAmounts) || data;
                        const amounts = [currentData.inNetwork, currentData.oon];
                        const shortLabels = ['In-Network', 'OON'];
                        return [shortLabels[context.dataIndex], '$' + amounts[context.dataIndex] + 'M', value + '%'];
                    },
                    textAlign: 'center'
                },
                tooltip: {
                    filter: function(tooltipItem) {
                        return tooltipItem.datasetIndex === 0;
                    },
                    callbacks: {
                        label: function(context) {
                            const currentData = (leakagePieChart && leakagePieChart._customAmounts) || data;
                            const amountArr = [currentData.inNetwork, currentData.oon];
                            return `${context.label}: $${amountArr[context.dataIndex]}M (${context.parsed}%)`;
                        },
                        afterBody: function() {
                            const currentData = (leakagePieChart && leakagePieChart._customAmounts) || data;
                            const total = (currentData.inNetwork + currentData.oon).toFixed(1);
                            return `Total Cost: $${total}M`;
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0 && elements[0].datasetIndex === 0) {
                    const index = elements[0].index;
                    toggleNetworkView(index);
                }
            }
        }
    });

    // Store amounts for label updates
    leakagePieChart._customAmounts = { inNetwork: data.inNetwork, oon: data.oon };
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

    // Piedmont Clinic ACO (A3250) actual CMS MSSP quality data
    // Source: CMS Performance Year Financial and Quality Results Public Use Files
    // Quality scores based on APP (ACO Participant Incentive Program) measures
    qualityTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['PY2019', 'PY2020', 'PY2021', 'PY2022', 'PY2023', 'PY2024'],
            datasets: [{
                label: 'Piedmont ACO Quality Score',
                data: [96.00, 97.03, 92.49, 80.54, 79.79, 83.25],
                borderColor: 'var(--piedmont-primary)',
                backgroundColor: 'rgba(200, 78, 40, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 9,
                pointBackgroundColor: 'var(--piedmont-primary)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                borderWidth: 3
            }, {
                label: 'MSSP National Average',
                data: [92.0, 97.0, 91.0, 81.5, 82.3, 81.5],
                borderColor: '#95a5a6',
                backgroundColor: 'rgba(149, 165, 166, 0.05)',
                tension: 0.3,
                fill: false,
                borderDash: [5, 5],
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2
            }, {
                label: 'Quality Threshold (40th %ile)',
                data: [80.0, 80.0, 80.0, 80.0, 80.0, 80.0],
                borderColor: '#e74c3c',
                backgroundColor: 'transparent',
                tension: 0,
                fill: false,
                borderDash: [3, 3],
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(44, 62, 80, 0.95)',
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y.toFixed(1) + '%';
                            return label;
                        }
                    }
                },
                datalabels: {
                    display: function(context) {
                        return context.datasetIndex === 0; // Only show labels for Piedmont ACO line
                    },
                    color: 'var(--piedmont-primary)',
                    font: { weight: 'bold', size: 11 },
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    formatter: function(value) {
                        return value.toFixed(1) + '%';
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 75,
                    max: 100,
                    ticks: {
                        stepSize: 5,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Cost trend chart data (shared between views)
const costTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    inpatient: [16.2, 15.8, 15.4, 15.1, 14.9, 15.2, 15.6, 15.3, 15.7, 16.1, 15.9, 16.0],
    outpatient: [12.1, 11.9, 12.3, 11.8, 11.6, 11.9, 12.2, 12.0, 12.4, 12.3, 12.1, 12.2],
    professional: [7.5, 7.4, 7.6, 7.3, 7.2, 7.4, 7.5, 7.4, 7.6, 7.5, 7.4, 7.5],
    pharmacy: [4.1, 4.0, 4.2, 4.1, 4.0, 4.1, 4.2, 4.1, 4.2, 4.1, 4.0, 4.1]
};

let currentCostChartType = 'stacked';
let showPharmacy = false;

function initCostTrendChart(chartType = 'stacked') {
    const ctx = document.getElementById('costTrendChart');
    if (!ctx) return;

    if (costTrendChart) {
        costTrendChart.destroy();
    }

    currentCostChartType = chartType;

    if (chartType === 'line') {
        // Line chart view
        const datasets = [{
            label: 'Inpatient',
            data: costTrendData.inpatient,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2
        }, {
            label: 'Outpatient',
            data: costTrendData.outpatient,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2
        }, {
            label: 'Professional',
            data: costTrendData.professional,
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2
        }];

        // Conditionally add pharmacy if toggle is on
        if (showPharmacy) {
            datasets.push({
                label: 'Pharmacy',
                data: costTrendData.pharmacy,
                borderColor: '#f1c40f',
                backgroundColor: 'rgba(241, 196, 15, 0.1)',
                tension: 0.3,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2
            });
        }

        costTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: costTrendData.labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    datalabels: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + context.parsed.y.toFixed(1) + 'M';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value + 'M';
                            }
                        }
                    }
                }
            }
        });
    } else {
        // Stacked bar chart view (default)
        const datasets = [{
            label: 'Inpatient',
            data: costTrendData.inpatient,
            backgroundColor: 'rgba(102, 126, 234, 0.85)',
            stack: 'stack1'
        }, {
            label: 'Outpatient',
            data: costTrendData.outpatient,
            backgroundColor: 'rgba(52, 152, 219, 0.85)',
            stack: 'stack1'
        }, {
            label: 'Professional',
            data: costTrendData.professional,
            backgroundColor: 'rgba(46, 204, 113, 0.85)',
            stack: 'stack1'
        }];

        // Conditionally add pharmacy if toggle is on
        if (showPharmacy) {
            datasets.push({
                label: 'Pharmacy',
                data: costTrendData.pharmacy,
                backgroundColor: 'rgba(241, 196, 15, 0.85)',
                stack: 'stack1'
            });
        }

        costTrendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: costTrendData.labels,
                datasets: datasets
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
                        color: '#fff',
                        font: {
                            weight: 'bold',
                            size: 9
                        },
                        anchor: 'center',
                        align: 'center',
                        formatter: function(value, context) {
                            // Only show value if it's large enough to fit
                            if (value >= 5) {
                                return '$' + value.toFixed(1) + 'M';
                            }
                            return '';
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + context.parsed.y.toFixed(1) + 'M';
                            },
                            footer: function(tooltipItems) {
                                let total = 0;
                                tooltipItems.forEach(item => {
                                    total += item.parsed.y;
                                });
                                return 'Total: $' + total.toFixed(1) + 'M';
                            }
                        }
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
}

// Toggle cost trend chart type
function setCostChartType(chartType) {
    // Update button states
    document.querySelectorAll('.chart-type-toggle .chart-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.chartType === chartType) {
            btn.classList.add('active');
        }
    });

    // Reinitialize chart with new type
    initCostTrendChart(chartType);
}

// Toggle pharmacy visibility in cost trend chart
function togglePharmacy() {
    const checkbox = document.getElementById('pharmacy-toggle');
    showPharmacy = checkbox ? checkbox.checked : false;

    // Reinitialize chart with current type and new pharmacy state
    initCostTrendChart(currentCostChartType);
}

window.setCostChartType = setCostChartType;
window.togglePharmacy = togglePharmacy;

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
                    label: 'Benchmark',
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
                                    'Click to view provider details'
                                ];
                            }
                            return `Benchmark: $${context.raw.toLocaleString()}`;
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
                        <span style="font-size: 0.8rem; color: #495057;">Benchmark:</span>
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
                        <span style="color: #495057;">vs Benchmark:</span>
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

            <!-- vs Benchmark Card -->
            <div class="kpi-card" style="background: linear-gradient(135deg, #cce5ff 0%, #b8daff 100%); border: 1px solid #3498db;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #004085; text-transform: uppercase; letter-spacing: 0.5px;">
                    vs Benchmark
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
                <svg style="width:20px;height:20px;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8"/><rect x="14" y="6" width="3" height="12"/></svg> Savings Calculation Breakdown
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
                    <th class="tooltip-trigger" data-tooltip="Percentage variance from benchmark ($${benchmark.avgCost.toLocaleString()}). Formula: ((Avg Cost - Benchmark) ÷ Benchmark) × 100">
                        vs Benchmark
                        <span class="info-icon">ⓘ</span>
                    </th>
                    <th class="tooltip-trigger" data-tooltip="Savings if this provider reduced costs to the hospital average ($${Math.round(hospitalAvg).toLocaleString()}). Formula: MAX(0, (Avg Cost - Hospital Avg) × Cases)">
                        Opportunity
                        <span class="info-icon">ⓘ</span>
                    </th>
                    <th class="tooltip-trigger" data-tooltip="Composite quality score (0-100) based on complications, readmissions, patient satisfaction, and clinical outcomes. Benchmark: ${benchmark.qualityScore}">
                        Quality Score
                        <span class="info-icon">ⓘ</span>
                    </th>
                    <th class="tooltip-trigger" data-tooltip="Rate of surgical complications within 90 days including infection, DVT, revision. Benchmark: ${benchmark.complications}%">
                        Complications
                        <span class="info-icon">ⓘ</span>
                    </th>
                    <th class="tooltip-trigger" data-tooltip="Percentage of patients readmitted within 30 days of discharge. Benchmark: ${benchmark.readmit30}%">
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
                <h4><svg style="width:16px;height:16px;vertical-align:-2px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8"/><rect x="14" y="6" width="3" height="12"/></svg>Benchmark Comparison</h4>
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
                    label: 'Benchmark',
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

// Reset all scenario sliders to default values
function resetScenarioVariables() {
    const defaults = [
        { slider: 'lives-slider', value: 'lives-val', defaultVal: 2, format: v => '+' + v + '%' },
        { slider: 'risk-slider', value: 'risk-val', defaultVal: 0, format: v => v + '.0%' },
        { slider: 'util-slider', value: 'util-val', defaultVal: -1, format: v => v + '%' },
        { slider: 'leak-slider', value: 'leak-val', defaultVal: 2, format: v => v + '%' }
    ];

    defaults.forEach(({slider, value, defaultVal, format}) => {
        const sliderEl = document.getElementById(slider);
        const valueEl = document.getElementById(value);

        if (sliderEl && valueEl) {
            sliderEl.value = defaultVal;
            valueEl.textContent = format(defaultVal);
        }
    });

    // Update projections with reset values
    updateProjectionValues();
}

// Make resetScenarioVariables available globally for onclick handler
window.resetScenarioVariables = resetScenarioVariables;

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

        // New patients have additional seasonal variance (higher in Jan-Feb, Sept-Oct)
        // This ensures the percentage actually changes with the slider
        const newPtSeasonalVariance = 1.0 + (Math.sin(proportion * Math.PI * 2) * 0.15); // ±15% seasonal variation
        const newPts = Math.round(baseMetrics.newPatients * proportion * seedVariance * newPtSeasonalVariance);

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

// Leakage filter state
let currentLeakageServiceType = 'all';
let currentElectiveFilter = 'all';

// Cross-filter data matrix: claim type x service type
// Realistic healthcare data: Part A = facility (inpatient heavy), Part B = professional/outpatient
const leakageFilterMatrix = {
    all: {
        all:          { inNetwork: 371.4, oon: 115.3, inPct: 76.3, oonPct: 23.7, benchmark: 97.3 },
        inpatient:    { inNetwork: 198.2, oon: 52.1, inPct: 79.2, oonPct: 20.8, benchmark: 42.8 },
        outpatient:   { inNetwork: 102.6, oon: 38.7, inPct: 72.6, oonPct: 27.4, benchmark: 32.1 },
        professional: { inNetwork: 70.6, oon: 24.5, inPct: 74.2, oonPct: 25.8, benchmark: 22.4 }
    },
    parta: {
        all:          { inNetwork: 206.1, oon: 54.6, inPct: 79.1, oonPct: 20.9, benchmark: 52.1 },
        inpatient:    { inNetwork: 192.4, oon: 50.8, inPct: 79.1, oonPct: 20.9, benchmark: 48.6 },
        outpatient:   { inNetwork: 8.5, oon: 2.2, inPct: 79.4, oonPct: 20.6, benchmark: 2.1 },
        professional: { inNetwork: 5.2, oon: 1.6, inPct: 76.5, oonPct: 23.5, benchmark: 1.4 }
    },
    partb: {
        all:          { inNetwork: 125.6, oon: 48.1, inPct: 72.3, oonPct: 27.7, benchmark: 34.7 },
        inpatient:    { inNetwork: 5.8, oon: 1.3, inPct: 81.7, oonPct: 18.3, benchmark: 1.2 },
        outpatient:   { inNetwork: 54.4, oon: 23.9, inPct: 69.5, oonPct: 30.5, benchmark: 13.4 },
        professional: { inNetwork: 65.4, oon: 22.9, inPct: 74.1, oonPct: 25.9, benchmark: 20.1 }
    }
};

function getLeakageFilteredData() {
    const claimType = currentLeakageView || 'all';
    const serviceType = currentLeakageServiceType || 'all';
    return leakageFilterMatrix[claimType][serviceType];
}

function setLeakageView(view) {
    currentLeakageView = view;

    // Update button states for claim type filter
    const claimButtons = document.querySelectorAll('.filter-btn[data-filter="claim"]');
    claimButtons.forEach(btn => {
        btn.classList.remove('active');
        if ((view === 'all' && btn.textContent.includes('All')) ||
            (view === 'parta' && btn.textContent.includes('Part A')) ||
            (view === 'partb' && btn.textContent.includes('Part B'))) {
            btn.classList.add('active');
        }
    });

    // Disable Professional service type when Part A is selected (Part A doesn't pay for professional services)
    const serviceButtons = document.querySelectorAll('.filter-btn[data-filter="service"]');
    serviceButtons.forEach(btn => {
        if (btn.textContent.includes('Professional')) {
            if (view === 'parta') {
                btn.disabled = true;
                btn.classList.add('disabled');
                // If Professional is currently selected, switch to All Services
                if (currentLeakageServiceType === 'professional') {
                    setLeakageServiceType('all');
                }
            } else {
                btn.disabled = false;
                btn.classList.remove('disabled');
            }
        }
    });

    updateLeakageDisplay();
    updateFacilitiesTable();
}

function setLeakageServiceType(serviceType) {
    currentLeakageServiceType = serviceType;

    // Update button states for service type filter
    const serviceButtons = document.querySelectorAll('.filter-btn[data-filter="service"]');
    serviceButtons.forEach(btn => {
        btn.classList.remove('active');
        if ((serviceType === 'all' && btn.textContent.includes('All')) ||
            (serviceType === 'inpatient' && btn.textContent.includes('Inpatient')) ||
            (serviceType === 'outpatient' && btn.textContent.includes('Outpatient')) ||
            (serviceType === 'professional' && btn.textContent.includes('Professional'))) {
            btn.classList.add('active');
        }
    });

    updateLeakageDisplay();
    updateFacilitiesTable();
}

function setElectiveFilter(filter) {
    currentElectiveFilter = filter;

    // Update button states for elective filter
    const electiveButtons = document.querySelectorAll('.filter-btn[data-filter="elective"]');
    electiveButtons.forEach(btn => {
        btn.classList.remove('active');
        if ((filter === 'all' && btn.textContent === 'All') ||
            (filter === 'elective' && btn.textContent.includes('Elective') && !btn.textContent.includes('Non')) ||
            (filter === 'non-elective' && btn.textContent.includes('Non-Elective'))) {
            btn.classList.add('active');
        }
    });

    updateFacilitiesTable();
}

function updateLeakageDisplay() {
    const data = getLeakageFilteredData();

    document.getElementById('in-network-spend').textContent = '$' + data.inNetwork + 'M';
    document.getElementById('in-network-pct').textContent = data.inPct + '%';
    document.getElementById('oon-spend').textContent = '$' + data.oon + 'M';
    document.getElementById('oon-pct').textContent = data.oonPct + '%';

    // Update benchmark
    const benchmarkEl = document.getElementById('leakage-benchmark');
    if (benchmarkEl) benchmarkEl.textContent = '$' + data.benchmark + 'M';

    // Update repatriation
    const repatriationEl = document.getElementById('repatriation-opportunity');
    const repatriationNoteEl = document.getElementById('repatriation-note');
    if (repatriationEl) {
        const repatriation = ((data.oonPct - 20) / 100 * (data.inNetwork + data.oon)).toFixed(1);
        repatriationEl.textContent = '$' + (repatriation > 0 ? repatriation : '0.0') + 'M';
    }
    if (repatriationNoteEl) {
        const viewLabel = currentLeakageView === 'parta' ? 'Part A' : currentLeakageView === 'partb' ? 'Part B' : 'All Claims';
        const serviceLabel = currentLeakageServiceType !== 'all' ? ' / ' + currentLeakageServiceType.charAt(0).toUpperCase() + currentLeakageServiceType.slice(1) : '';
        repatriationNoteEl.textContent = `${viewLabel}${serviceLabel} - if reduced to 20% benchmark`;
    }

    // Update pie chart (both main dataset and shadow ring)
    if (leakagePieChart) {
        leakagePieChart.data.datasets[0].data = [data.inPct, data.oonPct];
        if (leakagePieChart.data.datasets[1]) {
            leakagePieChart.data.datasets[1].data = [data.inPct, data.oonPct];
        }
        leakagePieChart._customAmounts = { inNetwork: data.inNetwork, oon: data.oon };
        leakagePieChart.update();
    }
}

// Facilities data for different filters
const facilitiesData = {
    all: {
        elective: [
            { name: 'Emory St. Joseph\'s Hospital', type: 'Acute Care Hospital', spend: '$14,892,334', patients: 1456, service: 'Cardiac Surgery', providers: ['Dr. James Wilson, MD - Cardiothoracic', 'Dr. Sarah Kim, MD - Interventional Cardiology', 'Dr. Michael Torres, MD - Cardiac Anesthesia'], elective: true },
            { name: 'Northside Hospital Atlanta', type: 'Acute Care Hospital', spend: '$11,234,556', patients: 1823, service: 'Orthopedic Surgery', providers: ['Dr. Robert Chen, MD - Orthopedic Surgery', 'Dr. Lisa Patel, MD - Sports Medicine', 'Dr. David Brown, MD - Joint Replacement'], elective: true },
            { name: 'Peachtree Advanced Imaging', type: 'Imaging Center', spend: '$8,923,441', patients: 3421, service: 'MRI / CT Scans', providers: ['Dr. Kevin Lee, MD - Radiology', 'Dr. Jennifer Smith, MD - Neuroradiology'], elective: true }
        ],
        nonElective: [
            { name: 'WellStar Kennestone Hospital', type: 'Acute Care Hospital', spend: '$9,456,778', patients: 2134, service: 'Emergency Services', providers: ['Dr. Amanda Martinez, MD - Emergency Medicine', 'Dr. John Davis, MD - Trauma Surgery', 'Dr. Emily Wong, MD - Critical Care'], elective: false },
            { name: 'Grady Memorial Hospital', type: 'Trauma Center', spend: '$7,234,112', patients: 892, service: 'Trauma / Emergency', providers: ['Dr. Marcus Johnson, MD - Trauma Surgery', 'Dr. Patricia Williams, MD - Emergency Medicine', 'Dr. Steven Rodriguez, MD - Neurosurgery'], elective: false }
        ]
    },
    parta: {
        elective: [
            { name: 'Emory University Hospital', type: 'Acute Care Hospital', spend: '$9,234,556', patients: 892, service: 'Cardiac Surgery', providers: ['Dr. James Wilson, MD - Cardiothoracic', 'Dr. Anthony Lee, MD - CV Surgery'], elective: true },
            { name: 'Piedmont Atlanta Hospital', type: 'Acute Care Hospital', spend: '$7,823,441', patients: 734, service: 'Joint Replacement', providers: ['Dr. Robert Chen, MD - Orthopedic Surgery', 'Dr. Maria Santos, MD - Orthopedics'], elective: true },
            { name: 'Northside Hospital Forsyth', type: 'Acute Care Hospital', spend: '$6,456,223', patients: 612, service: 'Spine Surgery', providers: ['Dr. David Park, MD - Neurosurgery', 'Dr. Lisa Wong, MD - Spine Surgery'], elective: true }
        ],
        nonElective: [
            { name: 'Grady Memorial Hospital', type: 'Level I Trauma', spend: '$5,892,334', patients: 478, service: 'Trauma Services', providers: ['Dr. Marcus Johnson, MD - Trauma Surgery', 'Dr. Patricia Williams, MD - Emergency Medicine'], elective: false },
            { name: 'WellStar Kennestone Hospital', type: 'Acute Care Hospital', spend: '$4,567,112', patients: 534, service: 'Emergency Admissions', providers: ['Dr. Amanda Martinez, MD - Emergency Medicine', 'Dr. John Davis, MD - Hospitalist'], elective: false }
        ]
    },
    partb: {
        elective: [
            { name: 'Peachtree Advanced Imaging', type: 'Imaging Center', spend: '$6,234,556', patients: 4521, service: 'Advanced Imaging', providers: ['Dr. Kevin Lee, MD - Radiology', 'Dr. Jennifer Smith, MD - Neuroradiology'], elective: true },
            { name: 'Atlanta Cardiology Associates', type: 'Cardiology Group', spend: '$5,892,334', patients: 1823, service: 'Cardiology Consults', providers: ['Dr. William Harris, MD - Cardiology', 'Dr. Susan Miller, MD - Interventional'], elective: true },
            { name: 'Southern Orthopedic Specialists', type: 'Specialty Group', spend: '$4,567,223', patients: 1456, service: 'Orthopedic Consults', providers: ['Dr. Richard Taylor, MD - Sports Medicine', 'Dr. Nancy Clark, MD - Orthopedics'], elective: true }
        ],
        nonElective: [
            { name: 'Metro Emergency Physicians', type: 'Emergency Group', spend: '$3,456,778', patients: 2134, service: 'ED Professional Fees', providers: ['Dr. John Martinez, MD - Emergency Medicine', 'Dr. Sarah Johnson, MD - Emergency Medicine'], elective: false },
            { name: 'Georgia Anesthesia Associates', type: 'Anesthesia Group', spend: '$2,892,112', patients: 1567, service: 'Emergency Anesthesia', providers: ['Dr. Michael Torres, MD - Anesthesiology', 'Dr. Karen White, MD - Anesthesiology'], elective: false }
        ]
    }
};

function updateFacilitiesTable() {
    const tbody = document.getElementById('oon-facilities-tbody');
    if (!tbody) return;

    const viewData = facilitiesData[currentLeakageView] || facilitiesData.all;
    let facilities = [];

    if (currentElectiveFilter === 'all') {
        facilities = [...viewData.elective, ...viewData.nonElective];
    } else if (currentElectiveFilter === 'elective') {
        facilities = viewData.elective;
    } else {
        facilities = viewData.nonElective;
    }

    // Sort by spend (descending)
    facilities.sort((a, b) => {
        const spendA = parseFloat(a.spend.replace(/[$,]/g, ''));
        const spendB = parseFloat(b.spend.replace(/[$,]/g, ''));
        return spendB - spendA;
    });

    // Take top 5
    facilities = facilities.slice(0, 5);

    tbody.innerHTML = facilities.map(f => {
        // Generate facility ID from name (lowercase, replace spaces/apostrophes with hyphens)
        const facilityId = f.name.toLowerCase().replace(/[']/g, '').replace(/\s+/g, '-');
        return `
        <tr>
            <td><strong>${f.name}</strong></td>
            <td>${f.type}</td>
            <td class="bad">${f.spend}</td>
            <td>${f.patients.toLocaleString()}</td>
            <td>${f.service}</td>
            <td class="rendering-providers">
                ${f.providers.map(p => `<div>${p}</div>`).join('')}
            </td>
            <td><span class="badge ${f.elective ? 'elective' : 'non-elective'}">${f.elective ? 'Elective' : 'Non-Elective'}</span></td>
            <td><button class="btn-small" onclick="event.stopPropagation(); showFacilityLeakageDetail('${facilityId}')">View Details</button></td>
        </tr>
        `;
    }).join('');
}

// Navigate to a specific tab
function navigateToTab(tabName) {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(nav => nav.classList.remove('active'));
    tabContents.forEach(tab => tab.classList.remove('active'));

    // Find and activate the target nav item
    const targetNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
    }

    // Activate the target tab
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');

        // Re-render charts when tab becomes visible
        setTimeout(() => {
            if (tabName === 'leakage' && leakagePieChart) {
                leakagePieChart.resize();
            }
            if (tabName === 'tcoc' && costPieChart) {
                costPieChart.resize();
            }
        }, 100);
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.navigateToTab = navigateToTab;
window.setLeakageServiceType = setLeakageServiceType;
window.setElectiveFilter = setElectiveFilter;

// Georgia County Leakage Data (FIPS codes for matching with TopoJSON)
// Note: totalLeakage = total cost (not OON cost). OON Leakage = totalLeakage × leakageScore
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
        // Calculate OON Cost from Total Cost × Leakage %
        const totalCost = countyData.totalLeakage; // totalLeakage represents total cost
        const oonCost = totalCost * countyData.leakageScore;

        tooltip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 6px; font-size: 14px;">${countyData.name} County</div>
            <div style="margin-bottom: 4px;">OON Cost: <strong style="color: #e74c3c;">$${(oonCost / 1000000).toFixed(1)}M</strong></div>
            <div style="margin-bottom: 4px;">Leakage %: <strong>${(countyData.leakageScore * 100).toFixed(0)}%</strong></div>
            <div style="font-size: 10px; margin-top: 6px; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 6px;">Click for facility details</div>
        `;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.clientX + 15) + 'px';
        tooltip.style.top = (event.clientY - 10) + 'px';

        // Update county detail panel
        updateCountyDetailPanel(countyData);
    }
}

function updateCountyDetailPanel(countyData) {
    const titleEl = document.getElementById('county-detail-title');
    const subtitleEl = document.getElementById('county-detail-subtitle');
    const contentEl = document.getElementById('county-detail-content');

    if (!titleEl || !contentEl) return;

    if (!countyData || !countyData.facilities) {
        titleEl.textContent = 'Hover over a county to see details';
        subtitleEl.textContent = 'Provider and service breakdown will appear here';
        contentEl.innerHTML = `
            <div class="county-placeholder">
                <div class="placeholder-icon">🗺️</div>
                <p>Select a county on the map to view:</p>
                <ul>
                    <li>Top OON rendering providers</li>
                    <li>Elective vs. non-elective breakdown</li>
                    <li>Primary services driving leakage</li>
                    <li>Patient count and total cost</li>
                </ul>
            </div>
        `;
        return;
    }

    // Calculate elective/non-elective totals
    let electiveTotal = 0;
    let nonElectiveTotal = 0;
    let allProviders = [];

    countyData.facilities.forEach(facility => {
        facility.services.forEach(service => {
            if (service.isElective) {
                electiveTotal += service.spend;
            } else {
                nonElectiveTotal += service.spend;
            }
            allProviders.push({
                name: service.provider,
                service: service.name,
                spend: service.spend,
                isElective: service.isElective,
                facility: facility.name
            });
        });
    });

    const totalSpend = electiveTotal + nonElectiveTotal;
    const electivePct = totalSpend > 0 ? ((electiveTotal / totalSpend) * 100).toFixed(0) : 0;

    // Sort providers by spend
    allProviders.sort((a, b) => b.spend - a.spend);
    const topProviders = allProviders.slice(0, 5);

    // Calculate OON Leakage from Total Cost × Leakage %
    const totalCost = countyData.totalLeakage; // totalLeakage represents total cost
    const oonLeakage = totalCost * countyData.leakageScore;

    titleEl.textContent = `${countyData.name} County`;
    subtitleEl.textContent = `Total Cost: $${(totalCost / 1000000).toFixed(1)}M`;

    contentEl.innerHTML = `
        <div class="county-stats-grid">
            <div class="county-stat">
                <div class="stat-label">Total OON Leakage</div>
                <div class="stat-value bad">$${(oonLeakage / 1000000).toFixed(1)}M</div>
            </div>
            <div class="county-stat">
                <div class="stat-label">Leakage %</div>
                <div class="stat-value">${(countyData.leakageScore * 100).toFixed(0)}%</div>
            </div>
            <div class="county-stat">
                <div class="stat-label">Elective</div>
                <div class="stat-value">$${(electiveTotal / 1000000).toFixed(1)}M</div>
            </div>
            <div class="county-stat">
                <div class="stat-label">Non-Elective</div>
                <div class="stat-value">$${(nonElectiveTotal / 1000000).toFixed(1)}M</div>
            </div>
        </div>

        <div class="county-breakdown">
            <h5>Elective vs. Non-Elective</h5>
            <div class="breakdown-bar">
                <span class="elective-fill" style="width: ${electivePct}%;"></span>
            </div>
            <div class="breakdown-legend">
                <span>Elective: ${electivePct}%</span>
                <span>Non-Elective: ${100 - electivePct}%</span>
            </div>
        </div>

        <div class="county-provider-list">
            <h5><svg style="width:14px;height:14px;vertical-align:-2px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>Top Rendering Providers</h5>
            <div id="county-providers-list">
            ${topProviders.slice(0, 5).map(p => `
                <div class="county-provider-item">
                    <div class="provider-name">${p.name}</div>
                    <div class="provider-details">
                        ${p.service} • $${(p.spend / 1000000).toFixed(2)}M •
                        <span style="color: ${p.isElective ? '#27ae60' : '#e74c3c'};">${p.isElective ? 'Elective' : 'Non-Elective'}</span>
                    </div>
                    <div class="provider-details" style="font-size: 0.75rem; opacity: 0.8;">${p.facility}</div>
                </div>
            `).join('')}
            </div>
            ${allProviders.length > 5 ? `
                <button class="filter-btn small" style="margin-top: 0.5rem; width: 100%;" onclick="toggleAllProviders(this)" data-providers='${JSON.stringify(allProviders.map(p => ({name: p.name, service: p.service, spend: p.spend, isElective: p.isElective, facility: p.facility}))).replace(/'/g, "&#39;")}'>
                    Show All ${allProviders.length} Providers
                </button>
            ` : ''}
        </div>

        <div class="county-provider-list">
            <h5><svg style="width:14px;height:14px;vertical-align:-2px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>Primary Services</h5>
            ${countyData.facilities.slice(0, 3).map(f => `
                <div class="county-provider-item">
                    <div class="provider-name">${f.name}</div>
                    <div class="provider-details">
                        ${f.services.map(s => s.name).join(', ')}
                    </div>
                    <div class="provider-details" style="font-size: 0.75rem;">
                        Total: $${(f.spend / 1000000).toFixed(2)}M
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function toggleAllProviders(btn) {
    const listEl = document.getElementById('county-providers-list');
    if (!listEl) return;

    const providers = JSON.parse(btn.dataset.providers);
    const isExpanded = btn.textContent.includes('Show Less');

    if (isExpanded) {
        // Show only top 5
        listEl.innerHTML = providers.slice(0, 5).map(p => `
            <div class="county-provider-item">
                <div class="provider-name">${p.name}</div>
                <div class="provider-details">
                    ${p.service} • $${(p.spend / 1000000).toFixed(2)}M •
                    <span style="color: ${p.isElective ? '#27ae60' : '#e74c3c'};">${p.isElective ? 'Elective' : 'Non-Elective'}</span>
                </div>
                <div class="provider-details" style="font-size: 0.75rem; opacity: 0.8;">${p.facility}</div>
            </div>
        `).join('');
        btn.textContent = `Show All ${providers.length} Providers`;
    } else {
        // Show all
        listEl.innerHTML = providers.map(p => `
            <div class="county-provider-item">
                <div class="provider-name">${p.name}</div>
                <div class="provider-details">
                    ${p.service} • $${(p.spend / 1000000).toFixed(2)}M •
                    <span style="color: ${p.isElective ? '#27ae60' : '#e74c3c'};">${p.isElective ? 'Elective' : 'Non-Elective'}</span>
                </div>
                <div class="provider-details" style="font-size: 0.75rem; opacity: 0.8;">${p.facility}</div>
            </div>
        `).join('');
        btn.textContent = 'Show Less';
    }
}
window.toggleAllProviders = toggleAllProviders;

function hideCountyTooltip() {
    const tooltip = document.getElementById('county-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

function showCountyDrillDown(county) {
    // Calculate OON Leakage from Total Cost × Leakage %
    const totalCost = county.totalLeakage; // totalLeakage represents total cost
    const oonLeakage = totalCost * county.leakageScore;

    let modalBody = `
        <h2 style="margin-bottom: 0.5rem;">${county.name} - Leakage Analysis</h2>
        <p style="color: #7f8c8d; margin-bottom: 1.5rem;">Out-of-Network referral patterns and cost breakdown</p>

        <div class="market-kpi-row" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 1.5rem;">
            <div class="kpi-box">
                <div class="kpi-label">Total Cost</div>
                <div class="kpi-value">$${(totalCost / 1000000).toFixed(2)}M</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label">Total OON Leakage</div>
                <div class="kpi-value bad">$${(oonLeakage / 1000000).toFixed(2)}M</div>
            </div>
            <div class="kpi-box">
                <div class="kpi-label">Leakage %</div>
                <div class="kpi-value" style="color: ${county.leakageScore > 0.6 ? '#e74c3c' : county.leakageScore > 0.3 ? '#f39c12' : '#27ae60'};">${(county.leakageScore * 100).toFixed(0)}%</div>
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
                            <th style="text-align: right;">Cost</th>
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
                    <th>PMPM Cost</th>
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

        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin: 1.5rem 0; text-align: center;">
            <strong style="color: #856404; font-size: 0.9rem;">⚠️ SYNTHETIC DATA - NOT REAL PHI</strong>
            <div style="color: #856404; font-size: 0.75rem; margin-top: 0.25rem;">Patient-level data is synthetically generated for demonstration purposes only.</div>
        </div>

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
                <svg style="width:20px;height:20px;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8"/><rect x="14" y="6" width="3" height="12"/></svg> Savings Calculation Breakdown by Attributed PCP
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
                <svg style="width:16px;height:16px;vertical-align:-3px;margin-right:0.5rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>Methodology & Definitions
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; font-size: 0.8rem; color: #5a6c7d;">
                <div>
                    <strong style="color: #2c3e50;">Attribution Definition:</strong>
                    <p style="margin: 0.25rem 0 0 0;">Patients attributed to PCP based on plurality of E/M visits in 24-month lookback period. Attribution follows CMS MSSP methodology for determining the primary care provider relationship.</p>
                </div>
                <div>
                    <strong style="color: #2c3e50;">Avoidable ED Visit Definition:</strong>
                    <p style="margin: 0.25rem 0 0 0;">ED visits classified as avoidable per NYU ED Algorithm. Includes conditions treatable in primary care, urgent care, or via telehealth (e.g., URI, UTI, minor injuries, non-emergent back pain).</p>
                </div>
                <div>
                    <strong style="color: #2c3e50;">Cost/Visit Calculation:</strong>
                    <p style="margin: 0.25rem 0 0 0;">Total allowed amount including facility fees (ED, observation) + professional fees (physician, radiology, labs). Represents actual paid claims, not billed charges.</p>
                </div>
                <div>
                    <strong style="color: #2c3e50;">Savings Potential Formula:</strong>
                    <p style="margin: 0.25rem 0 0 0;"><code style="background:#e9ecef;padding:2px 6px;border-radius:4px;font-size:0.85em;">Savings = Avoidable ED Visits × (Avg ED Cost/Visit − Avg Urgent Care/PCP Visit Cost)</code><br>Alternative care costs by avoidable category: Primary Care Treatable → PCP visit ($95); Urgent Care Appropriate → UC visit ($150); Non-Emergent → UC visit ($150). Does not include pharmacy or follow-up savings.</p>
                </div>
            </div>
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

        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin: 1.5rem 0; text-align: center;">
            <strong style="color: #856404; font-size: 0.9rem;">⚠️ SYNTHETIC DATA - NOT REAL PHI</strong>
            <div style="color: #856404; font-size: 0.75rem; margin-top: 0.25rem;">Patient-level data is synthetically generated for demonstration purposes only.</div>
        </div>

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
                <svg style="width:16px;height:16px;vertical-align:-3px;margin-right:0.5rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>Data Definitions & Calculations
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

// ==============================================
// AVOIDABLE UTILIZATION - ED & IP DATA AND FUNCTIONS
// ==============================================

// Current avoidable view state: 'ed', 'ip', or 'all'
let currentAvoidableView = 'ed';

// Comprehensive avoidable utilization data by market
const avoidableMarketData = {
    'atlanta-south': {
        ed: {
            totalVisits: 4231,
            avoidableCount: 1523,
            avoidablePct: 36.0,
            costImpact: 1868271,
            avgCostPerVisit: 1226,
            savingsPotential: 1400000,
            pcps: [
                { pcp: 'Dr. Sarah Mitchell', pcpId: 'mitchell-s', lives: 1847, total: 1523, avoidable: 548, avoidablePct: 36.0, costPerVisit: 1226, savingsPotential: 671848 },
                { pcp: 'Dr. James Wilson', pcpId: 'wilson-j', lives: 1623, total: 1342, avoidable: 483, avoidablePct: 36.0, costPerVisit: 1226, savingsPotential: 592158 },
                { pcp: 'Dr. Maria Garcia', pcpId: 'garcia-m', lives: 1245, total: 892, avoidable: 321, avoidablePct: 36.0, costPerVisit: 1226, savingsPotential: 393546 },
                { pcp: 'Dr. Robert Chen', pcpId: 'chen-r', lives: 987, total: 474, avoidable: 171, avoidablePct: 36.1, costPerVisit: 1226, savingsPotential: 209646 }
            ]
        },
        ip: {
            totalAdmissions: 892,
            avoidableCount: 187,
            avoidablePct: 21.0,
            costImpact: 2805000,
            avgCostPerAdmission: 15000,
            savingsPotential: 1870000,
            pcps: [
                { pcp: 'Dr. Sarah Mitchell', pcpId: 'mitchell-s', lives: 1847, total: 321, avoidable: 67, avoidablePct: 20.9, costPerAdmission: 15000, savingsPotential: 670000 },
                { pcp: 'Dr. James Wilson', pcpId: 'wilson-j', lives: 1623, total: 283, avoidable: 60, avoidablePct: 21.2, costPerAdmission: 15000, savingsPotential: 600000 },
                { pcp: 'Dr. Maria Garcia', pcpId: 'garcia-m', lives: 1245, total: 188, avoidable: 39, avoidablePct: 20.7, costPerAdmission: 15000, savingsPotential: 390000 },
                { pcp: 'Dr. Robert Chen', pcpId: 'chen-r', lives: 987, total: 100, avoidable: 21, avoidablePct: 21.0, costPerAdmission: 15000, savingsPotential: 210000 }
            ]
        }
    },
    'augusta': {
        ed: {
            totalVisits: 2187,
            avoidableCount: 789,
            avoidablePct: 36.1,
            costImpact: 967803,
            avgCostPerVisit: 1227,
            savingsPotential: 725000,
            pcps: [
                { pcp: 'Dr. Patricia Brown', pcpId: 'brown-p', lives: 1234, total: 876, avoidable: 316, avoidablePct: 36.1, costPerVisit: 1227, savingsPotential: 387732 },
                { pcp: 'Dr. Michael Davis', pcpId: 'davis-m', lives: 1123, total: 698, avoidable: 252, avoidablePct: 36.1, costPerVisit: 1227, savingsPotential: 309204 },
                { pcp: 'Dr. Jennifer Lee', pcpId: 'lee-j', lives: 876, total: 413, avoidable: 149, avoidablePct: 36.1, costPerVisit: 1227, savingsPotential: 182823 },
                { pcp: 'Dr. William Taylor', pcpId: 'taylor-w', lives: 654, total: 200, avoidable: 72, avoidablePct: 36.0, costPerVisit: 1227, savingsPotential: 88344 }
            ]
        },
        ip: {
            totalAdmissions: 462,
            avoidableCount: 111,
            avoidablePct: 24.0,
            costImpact: 1665000,
            avgCostPerAdmission: 15000,
            savingsPotential: 1110000,
            pcps: [
                { pcp: 'Dr. Patricia Brown', pcpId: 'brown-p', lives: 1234, total: 185, avoidable: 44, avoidablePct: 23.8, costPerAdmission: 15000, savingsPotential: 440000 },
                { pcp: 'Dr. Michael Davis', pcpId: 'davis-m', lives: 1123, total: 148, avoidable: 36, avoidablePct: 24.3, costPerAdmission: 15000, savingsPotential: 360000 },
                { pcp: 'Dr. Jennifer Lee', pcpId: 'lee-j', lives: 876, total: 87, avoidable: 21, avoidablePct: 24.1, costPerAdmission: 15000, savingsPotential: 210000 },
                { pcp: 'Dr. William Taylor', pcpId: 'taylor-w', lives: 654, total: 42, avoidable: 10, avoidablePct: 23.8, costPerAdmission: 15000, savingsPotential: 100000 }
            ]
        }
    },
    'atlanta-north': {
        ed: {
            totalVisits: 3456,
            avoidableCount: 967,
            avoidablePct: 28.0,
            costImpact: 1186309,
            avgCostPerVisit: 1227,
            savingsPotential: 890000,
            pcps: [
                { pcp: 'Dr. Elizabeth Martinez', pcpId: 'martinez-e', lives: 1567, total: 1245, avoidable: 349, avoidablePct: 28.0, costPerVisit: 1227, savingsPotential: 428223 },
                { pcp: 'Dr. David Anderson', pcpId: 'anderson-d', lives: 1345, total: 987, avoidable: 276, avoidablePct: 28.0, costPerVisit: 1227, savingsPotential: 338652 },
                { pcp: 'Dr. Susan Thompson', pcpId: 'thompson-s', lives: 1123, total: 789, avoidable: 221, avoidablePct: 28.0, costPerVisit: 1227, savingsPotential: 271167 },
                { pcp: 'Dr. Richard White', pcpId: 'white-r', lives: 876, total: 435, avoidable: 121, avoidablePct: 27.8, costPerVisit: 1227, savingsPotential: 148467 }
            ]
        },
        ip: {
            totalAdmissions: 729,
            avoidableCount: 117,
            avoidablePct: 16.0,
            costImpact: 1755000,
            avgCostPerAdmission: 15000,
            savingsPotential: 1170000,
            pcps: [
                { pcp: 'Dr. Elizabeth Martinez', pcpId: 'martinez-e', lives: 1567, total: 263, avoidable: 42, avoidablePct: 16.0, costPerAdmission: 15000, savingsPotential: 420000 },
                { pcp: 'Dr. David Anderson', pcpId: 'anderson-d', lives: 1345, total: 208, avoidable: 33, avoidablePct: 15.9, costPerAdmission: 15000, savingsPotential: 330000 },
                { pcp: 'Dr. Susan Thompson', pcpId: 'thompson-s', lives: 1123, total: 166, avoidable: 27, avoidablePct: 16.3, costPerAdmission: 15000, savingsPotential: 270000 },
                { pcp: 'Dr. Richard White', pcpId: 'white-r', lives: 876, total: 92, avoidable: 15, avoidablePct: 16.3, costPerAdmission: 15000, savingsPotential: 150000 }
            ]
        }
    },
    'columbus': {
        ed: {
            totalVisits: 2534,
            avoidableCount: 658,
            avoidablePct: 26.0,
            costImpact: 807066,
            avgCostPerVisit: 1227,
            savingsPotential: 605000,
            pcps: [
                { pcp: 'Dr. Karen Johnson', pcpId: 'johnson-k', lives: 1234, total: 987, avoidable: 257, avoidablePct: 26.0, costPerVisit: 1227, savingsPotential: 315339 },
                { pcp: 'Dr. Thomas Moore', pcpId: 'moore-t', lives: 1098, total: 765, avoidable: 199, avoidablePct: 26.0, costPerVisit: 1227, savingsPotential: 244173 },
                { pcp: 'Dr. Nancy Clark', pcpId: 'clark-n', lives: 876, total: 523, avoidable: 136, avoidablePct: 26.0, costPerVisit: 1227, savingsPotential: 166872 },
                { pcp: 'Dr. Joseph Lewis', pcpId: 'lewis-j', lives: 654, total: 259, avoidable: 66, avoidablePct: 25.5, costPerVisit: 1227, savingsPotential: 80982 }
            ]
        },
        ip: {
            totalAdmissions: 535,
            avoidableCount: 75,
            avoidablePct: 14.0,
            costImpact: 1125000,
            avgCostPerAdmission: 15000,
            savingsPotential: 750000,
            pcps: [
                { pcp: 'Dr. Karen Johnson', pcpId: 'johnson-k', lives: 1234, total: 208, avoidable: 29, avoidablePct: 13.9, costPerAdmission: 15000, savingsPotential: 290000 },
                { pcp: 'Dr. Thomas Moore', pcpId: 'moore-t', lives: 1098, total: 162, avoidable: 23, avoidablePct: 14.2, costPerAdmission: 15000, savingsPotential: 230000 },
                { pcp: 'Dr. Nancy Clark', pcpId: 'clark-n', lives: 876, total: 110, avoidable: 15, avoidablePct: 13.6, costPerAdmission: 15000, savingsPotential: 150000 },
                { pcp: 'Dr. Joseph Lewis', pcpId: 'lewis-j', lives: 654, total: 55, avoidable: 8, avoidablePct: 14.5, costPerAdmission: 15000, savingsPotential: 80000 }
            ]
        }
    },
    'macon': {
        ed: {
            totalVisits: 1245,
            avoidableCount: 349,
            avoidablePct: 28.0,
            costImpact: 428223,
            avgCostPerVisit: 1227,
            savingsPotential: 321000,
            pcps: [
                { pcp: 'Dr. Linda Hall', pcpId: 'hall-l', lives: 654, total: 534, avoidable: 150, avoidablePct: 28.1, costPerVisit: 1227, savingsPotential: 184050 },
                { pcp: 'Dr. Charles Young', pcpId: 'young-c', lives: 543, total: 412, avoidable: 115, avoidablePct: 27.9, costPerVisit: 1227, savingsPotential: 141105 },
                { pcp: 'Dr. Barbara King', pcpId: 'king-b', lives: 432, total: 299, avoidable: 84, avoidablePct: 28.1, costPerVisit: 1227, savingsPotential: 103068 }
            ]
        },
        ip: {
            totalAdmissions: 263,
            avoidableCount: 47,
            avoidablePct: 17.9,
            costImpact: 705000,
            avgCostPerAdmission: 15000,
            savingsPotential: 470000,
            pcps: [
                { pcp: 'Dr. Linda Hall', pcpId: 'hall-l', lives: 654, total: 113, avoidable: 20, avoidablePct: 17.7, costPerAdmission: 15000, savingsPotential: 200000 },
                { pcp: 'Dr. Charles Young', pcpId: 'young-c', lives: 543, total: 87, avoidable: 16, avoidablePct: 18.4, costPerAdmission: 15000, savingsPotential: 160000 },
                { pcp: 'Dr. Barbara King', pcpId: 'king-b', lives: 432, total: 63, avoidable: 11, avoidablePct: 17.5, costPerAdmission: 15000, savingsPotential: 110000 }
            ]
        }
    }
};

// Set avoidable utilization view and update table
function setAvoidableView(view) {
    currentAvoidableView = view;

    // Update toggle button states
    document.querySelectorAll('.avoidable-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update description
    const descriptions = {
        ed: '<strong>ED Avoidables (NYU ED Algorithm):</strong> Emergency visits treatable in primary care, urgent care, or telehealth - includes URI, UTI, minor injuries, non-emergent conditions.',
        ip: '<strong>IP Avoidables (AHRQ PQIs):</strong> Hospitalizations preventable through effective outpatient care - includes diabetes complications, COPD/asthma exacerbations, CHF decompensation, hypertension, bacterial pneumonia.',
        all: '<strong>Combined ED + IP Avoidables:</strong> Total avoidable utilization across both emergency and inpatient settings. Shows aggregate opportunity for care management interventions.'
    };

    const descEl = document.getElementById('avoidable-view-description');
    if (descEl) {
        const borderColors = { ed: '#e74c3c', ip: '#3498db', all: '#9b59b6' };
        descEl.innerHTML = descriptions[view];
        descEl.style.borderLeftColor = borderColors[view];
    }

    // Update table headers
    const totalHeader = document.getElementById('avoidable-total-header');
    const countHeader = document.getElementById('avoidable-count-header');

    if (view === 'ed') {
        if (totalHeader) totalHeader.innerHTML = 'Total ED Visits <span class="th-info">ⓘ</span>';
        if (countHeader) countHeader.innerHTML = 'Avoidable Visits <span class="th-info">ⓘ</span>';
    } else if (view === 'ip') {
        if (totalHeader) totalHeader.innerHTML = 'Total IP Admits <span class="th-info">ⓘ</span>';
        if (countHeader) countHeader.innerHTML = 'Avoidable Admits <span class="th-info">ⓘ</span>';
    } else {
        if (totalHeader) totalHeader.innerHTML = 'Total Utilization <span class="th-info">ⓘ</span>';
        if (countHeader) countHeader.innerHTML = 'Avoidable Count <span class="th-info">ⓘ</span>';
    }

    // Update table rows
    updateAvoidableTable(view);
}

// Update the avoidable market table
function updateAvoidableTable(view) {
    const tbody = document.getElementById('avoidable-market-tbody');
    if (!tbody) return;

    const markets = ['atlanta-south', 'augusta', 'atlanta-north', 'columbus', 'macon'];
    const marketNames = {
        'atlanta-south': 'Atlanta South',
        'augusta': 'Augusta',
        'atlanta-north': 'Atlanta North',
        'columbus': 'Columbus',
        'macon': 'Macon'
    };

    let html = '';

    markets.forEach(marketId => {
        const data = avoidableMarketData[marketId];
        let total, avoidable, pct, cost;

        if (view === 'ed') {
            total = data.ed.totalVisits;
            avoidable = data.ed.avoidableCount;
            pct = data.ed.avoidablePct;
            cost = data.ed.costImpact;
        } else if (view === 'ip') {
            total = data.ip.totalAdmissions;
            avoidable = data.ip.avoidableCount;
            pct = data.ip.avoidablePct;
            cost = data.ip.costImpact;
        } else {
            // Combined view
            total = data.ed.totalVisits + data.ip.totalAdmissions;
            avoidable = data.ed.avoidableCount + data.ip.avoidableCount;
            pct = ((avoidable / total) * 100).toFixed(1);
            cost = data.ed.costImpact + data.ip.costImpact;
        }

        // Determine class based on thresholds
        let pctClass, costClass;
        if (view === 'ed') {
            pctClass = pct > 33 ? 'bad' : pct > 27 ? 'warning' : 'good';
            costClass = cost > 1500000 ? 'bad' : cost > 1000000 ? 'warning' : '';
        } else if (view === 'ip') {
            pctClass = pct > 22 ? 'bad' : pct > 17 ? 'warning' : 'good';
            costClass = cost > 2000000 ? 'bad' : cost > 1500000 ? 'warning' : '';
        } else {
            pctClass = pct > 28 ? 'bad' : pct > 24 ? 'warning' : 'good';
            costClass = cost > 4000000 ? 'bad' : cost > 3000000 ? 'warning' : '';
        }

        html += `
            <tr onclick="drillDownAvoidableMarket('${marketId}')" class="clickable">
                <td><strong>${marketNames[marketId]}</strong></td>
                <td>${total.toLocaleString()}</td>
                <td class="${pctClass}">${avoidable.toLocaleString()}</td>
                <td class="${pctClass}">${pct}%</td>
                <td class="${costClass}">$${cost.toLocaleString()}</td>
                <td><button class="btn-small">View Details →</button></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Drill down into avoidable market detail with toggle
function drillDownAvoidableMarket(marketId) {
    const marketNames = {
        'atlanta-north': 'Atlanta North',
        'atlanta-south': 'Atlanta South',
        'augusta': 'Augusta',
        'columbus': 'Columbus',
        'macon': 'Macon'
    };

    const marketName = marketNames[marketId] || marketId;
    const data = avoidableMarketData[marketId];
    const view = currentAvoidableView;

    // Calculate totals based on view
    let viewData, unitLabel, alternativeCost, alternativeLabel, diversionRate;

    if (view === 'ed') {
        viewData = data.ed;
        unitLabel = 'ED Visits';
        alternativeCost = 150;
        alternativeLabel = 'Urgent Care';
        diversionRate = 0.65;
    } else if (view === 'ip') {
        viewData = data.ip;
        unitLabel = 'IP Admissions';
        alternativeCost = 3500;
        alternativeLabel = 'Observation';
        diversionRate = 0.45;
    } else {
        // Combined - we'll show both sections
        viewData = {
            total: data.ed.totalVisits + data.ip.totalAdmissions,
            avoidable: data.ed.avoidableCount + data.ip.avoidableCount,
            costImpact: data.ed.costImpact + data.ip.costImpact,
            savingsPotential: data.ed.savingsPotential + data.ip.savingsPotential
        };
        viewData.pct = ((viewData.avoidable / viewData.total) * 100).toFixed(1);
        unitLabel = 'Total Utilization';
        alternativeCost = null;
        alternativeLabel = null;
        diversionRate = 0.55;
    }

    const totalItems = view === 'all' ? viewData.total : (view === 'ed' ? viewData.totalVisits : viewData.totalAdmissions);
    const avoidableItems = view === 'all' ? viewData.avoidable : viewData.avoidableCount;
    const avoidablePct = view === 'all' ? viewData.pct : viewData.avoidablePct;
    const costImpact = view === 'all' ? viewData.costImpact : viewData.costImpact;
    const savingsPotential = view === 'all' ? viewData.savingsPotential : viewData.savingsPotential;
    const realisticSavings = Math.round(savingsPotential * diversionRate);

    // Get view-specific color
    const viewColors = { ed: '#e74c3c', ip: '#3498db', all: '#9b59b6' };
    const viewColor = viewColors[view];

    let modalBody = `
        <h2>${marketName} - Avoidable ${view === 'ed' ? 'ED' : view === 'ip' ? 'IP' : 'ED + IP'} Cost Opportunity</h2>
        <p class="provider-summary">Attributed PCP-level analysis showing savings from preventing avoidable utilization</p>

        <!-- View Toggle in Modal -->
        <div style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
            <div class="avoidable-toggle-container" style="display: flex; gap: 0.25rem; background: #f0f2f5; padding: 0.25rem; border-radius: 8px;">
                <button class="avoidable-toggle-btn ${view === 'ed' ? 'active' : ''}" data-view="ed" onclick="switchModalAvoidableView('${marketId}', 'ed')">ED Visits</button>
                <button class="avoidable-toggle-btn ${view === 'ip' ? 'active' : ''}" data-view="ip" onclick="switchModalAvoidableView('${marketId}', 'ip')">IP Admissions</button>
                <button class="avoidable-toggle-btn ${view === 'all' ? 'active' : ''}" data-view="all" onclick="switchModalAvoidableView('${marketId}', 'all')">Combined</button>
            </div>
        </div>

        <!-- Reference Values Bar -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; border-left: 4px solid ${viewColor};">
            <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
                <div>
                    <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Reference Values & Definitions</div>
                </div>
                <div style="display: flex; gap: 2.5rem; flex-wrap: wrap;">
                    ${view === 'ed' ? `
                        <div>
                            <span style="font-size: 0.8rem; color: #495057;">Avg ED Cost/Visit:</span>
                            <span style="font-weight: 700; color: #e74c3c; margin-left: 0.5rem; font-size: 1.1rem;">$${viewData.avgCostPerVisit?.toLocaleString() || '1,227'}</span>
                            <div style="font-size: 0.65rem; color: #888; margin-top: 0.15rem;">Facility + professional fees</div>
                        </div>
                        <div>
                            <span style="font-size: 0.8rem; color: #495057;">Urgent Care Cost:</span>
                            <span style="font-weight: 700; color: #27ae60; margin-left: 0.5rem; font-size: 1.1rem;">~$150</span>
                            <div style="font-size: 0.65rem; color: #888; margin-top: 0.15rem;">Alternative setting benchmark</div>
                        </div>
                    ` : view === 'ip' ? `
                        <div>
                            <span style="font-size: 0.8rem; color: #495057;">Avg IP Cost/Admit:</span>
                            <span style="font-weight: 700; color: #3498db; margin-left: 0.5rem; font-size: 1.1rem;">$${viewData.avgCostPerAdmission?.toLocaleString() || '15,000'}</span>
                            <div style="font-size: 0.65rem; color: #888; margin-top: 0.15rem;">Average admission cost</div>
                        </div>
                        <div>
                            <span style="font-size: 0.8rem; color: #495057;">Observation Cost:</span>
                            <span style="font-weight: 700; color: #27ae60; margin-left: 0.5rem; font-size: 1.1rem;">~$3,500</span>
                            <div style="font-size: 0.65rem; color: #888; margin-top: 0.15rem;">Alternative setting benchmark</div>
                        </div>
                    ` : `
                        <div>
                            <span style="font-size: 0.8rem; color: #495057;">ED Avoidable Cost:</span>
                            <span style="font-weight: 700; color: #e74c3c; margin-left: 0.5rem; font-size: 1.1rem;">$${data.ed.costImpact.toLocaleString()}</span>
                        </div>
                        <div>
                            <span style="font-size: 0.8rem; color: #495057;">IP Avoidable Cost:</span>
                            <span style="font-weight: 700; color: #3498db; margin-left: 0.5rem; font-size: 1.1rem;">$${data.ip.costImpact.toLocaleString()}</span>
                        </div>
                    `}
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Diversion Rate:</span>
                        <span style="font-weight: 700; color: #9b59b6; margin-left: 0.5rem; font-size: 1.1rem;">${Math.round(diversionRate * 100)}%</span>
                        <div style="font-size: 0.65rem; color: #888; margin-top: 0.15rem;">Industry achievable target</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 1.5rem;">
            <div class="kpi-card" style="background: white; border: 1px solid #e0e0e0;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">
                    Total Avoidable ${view === 'ip' ? 'Admissions' : view === 'ed' ? 'Visits' : 'Events'}
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: ${viewColor}; margin: 0.5rem 0;">
                    ${avoidableItems.toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;">
                    <span>${avoidablePct}% of ${totalItems.toLocaleString()} total</span>
                </div>
            </div>
            <div class="kpi-card" style="background: white; border: 1px solid #e0e0e0;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">
                    Total Cost Impact
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: #f39c12; margin: 0.5rem 0;">
                    $${costImpact.toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;">
                    <span>Avoidable spend</span>
                </div>
            </div>
            <div class="kpi-card" style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border: 1px solid #28a745;">
                <div class="kpi-label" style="font-size: 0.75rem; color: #155724; text-transform: uppercase;">
                    Realistic Savings (${Math.round(diversionRate * 100)}%)
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: #155724; margin: 0.5rem 0;">
                    $${realisticSavings.toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #155724; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(40,167,69,0.3);">
                    <span>Achievable with interventions</span>
                </div>
            </div>
        </div>
    `;

    // Add PCP breakdown table based on view
    if (view === 'all') {
        // Show both ED and IP tables
        modalBody += buildPCPTable(data.ed.pcps, marketId, 'ed', 'ED Visits');
        modalBody += buildPCPTable(data.ip.pcps, marketId, 'ip', 'IP Admissions');
    } else {
        const pcps = view === 'ed' ? data.ed.pcps : data.ip.pcps;
        modalBody += buildPCPTable(pcps, marketId, view, unitLabel);
    }

    // Add methodology
    modalBody += `
        <!-- Methodology Box -->
        <div style="background: #f8f9fa; border-radius: 12px; padding: 1.25rem; margin-top: 1.5rem; border: 1px solid #e0e0e0;">
            <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: #2c3e50;">
                <svg style="width:16px;height:16px;vertical-align:-3px;margin-right:0.5rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>Methodology & Definitions
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; font-size: 0.8rem; color: #5a6c7d;">
                <div>
                    <strong style="color: #2c3e50;">Attribution Definition:</strong>
                    <p style="margin: 0.25rem 0 0 0;">Patients attributed to PCP based on plurality of E/M visits in 24-month lookback period. Attribution follows CMS MSSP methodology for determining the primary care provider relationship.</p>
                </div>
                ${view === 'ed' || view === 'all' ? `
                <div>
                    <strong style="color: #e74c3c;">Avoidable ED Visit (NYU Algorithm):</strong>
                    <p style="margin: 0.25rem 0 0 0;">ED visits classified as avoidable per NYU ED Algorithm. Includes conditions treatable in primary care, urgent care, or via telehealth (URI, UTI, minor injuries, non-emergent back pain).</p>
                </div>
                ` : ''}
                ${view === 'ip' || view === 'all' ? `
                <div>
                    <strong style="color: #3498db;">Avoidable IP Admission (AHRQ PQIs):</strong>
                    <p style="margin: 0.25rem 0 0 0;">Hospitalizations preventable with effective outpatient care per AHRQ Prevention Quality Indicators (PQI-01 through PQI-16). Includes diabetes short/long-term complications, COPD/asthma exacerbations, CHF decompensation, hypertension, bacterial pneumonia, and UTI admissions.</p>
                </div>
                ` : ''}
                <div>
                    <strong style="color: #2c3e50;">Savings Calculation:</strong>
                    <p style="margin: 0.25rem 0 0 0;">
                    ${view === 'ed' ? `<code style="background:#e9ecef;padding:2px 6px;border-radius:4px;font-size:0.85em;">ED Savings = Avoidable ED Visits × (Avg ED Cost/Visit − Avg UC/PCP Visit Cost)</code><br>Alternative care costs: Primary Care Treatable → PCP visit ($95); Urgent Care Appropriate → UC visit ($150); Non-Emergent → UC visit ($150).`
                    : view === 'ip' ? `<code style="background:#e9ecef;padding:2px 6px;border-radius:4px;font-size:0.85em;">IP Savings = Avoidable Admissions × (Avg IP Cost/Admission − Avg Observation Stay Cost)</code><br>Observation stay cost based on 23-hour observation rate ($2,800 avg). Applicable to admissions where ambulatory-sensitive condition management could prevent hospitalization per AHRQ PQI methodology.`
                    : `<strong>ED:</strong> <code style="background:#e9ecef;padding:2px 6px;border-radius:4px;font-size:0.85em;">Avoidable ED Visits × (Avg ED Cost/Visit − Avg UC/PCP Visit Cost)</code><br>
                    <strong>IP:</strong> <code style="background:#e9ecef;padding:2px 6px;border-radius:4px;font-size:0.85em;">Avoidable Admissions × (Avg IP Cost/Admission − Avg Observation Stay Cost)</code><br>
                    ED alternatives: PCP visit ($95) or UC visit ($150). IP alternative: observation stay ($2,800 avg). Combined total represents the sum of ED + IP diversion savings.`}
                    </p>
                </div>
            </div>
        </div>
    `;

    showModal(modalBody);
}

// Build PCP breakdown table for modal
function buildPCPTable(pcps, marketId, viewType, unitLabel) {
    const isED = viewType === 'ed';
    const costLabel = isED ? 'Cost/Visit' : 'Cost/Admit';
    const totalLabel = isED ? 'Total ED' : 'Total IP';
    const avoidableLabel = isED ? 'Avoidable' : 'Avoidable';
    const viewColor = isED ? '#e74c3c' : '#3498db';

    let html = `
        <div style="background: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid #e0e0e0;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem;">
                <svg style="width:20px;height:20px;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="${isED ? '#e74c3c' : '#3498db'}" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg> ${unitLabel} Breakdown by Attributed PCP
            </h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Attributed PCP</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">${totalLabel}</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">${avoidableLabel}</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">% Avoidable</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">${costLabel}</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #d4edda;">Savings Potential</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    let totalAll = 0, avoidableAll = 0, savingsAll = 0;

    pcps.forEach(p => {
        const costPer = isED ? p.costPerVisit : p.costPerAdmission;
        totalAll += p.total;
        avoidableAll += p.avoidable;
        savingsAll += p.savingsPotential;

        html += `
            <tr>
                <td style="padding: 0.75rem; border-bottom: 1px solid #eee;"><strong>${p.pcp}</strong><br><span style="font-size: 0.75rem; color: #6c757d;">${p.lives.toLocaleString()} attributed lives</span></td>
                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">${p.total.toLocaleString()}</td>
                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: ${viewColor}; font-weight: 600;">${p.avoidable}</td>
                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: ${p.avoidablePct > (isED ? 33 : 20) ? viewColor : '#f39c12'};">${p.avoidablePct}%</td>
                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee;">$${costPer.toLocaleString()}</td>
                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; background: #f0fff0; font-weight: 600; color: #155724;">
                    $${p.savingsPotential.toLocaleString()}
                </td>
                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">
                    <button class="btn-small" onclick="showAvoidablePatientDetail('${marketId}', '${p.pcpId}', '${p.pcp}', ${p.avoidable}, ${costPer}, '${viewType}')" style="white-space: nowrap;">
                        Patient Detail
                    </button>
                </td>
            </tr>
        `;
    });

    const avgPct = ((avoidableAll / totalAll) * 100).toFixed(1);

    html += `
                        <tr style="background: #f8f9fa; font-weight: 700;">
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;">TOTAL</td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6;">${totalAll.toLocaleString()}</td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6; color: ${viewColor};">${avoidableAll.toLocaleString()}</td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6;">${avgPct}%</td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; text-align: right; border-top: 2px solid #dee2e6; background: #d4edda; color: #155724; font-size: 1.1rem;">$${savingsAll.toLocaleString()}</td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    return html;
}

// Switch view within the modal
function switchModalAvoidableView(marketId, view) {
    currentAvoidableView = view;

    // Update main page toggle too
    document.querySelectorAll('.avoidable-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update main table
    updateAvoidableTable(view);

    // Re-render modal with new view
    drillDownAvoidableMarket(marketId);
}

// Show patient detail for avoidable utilization (ED or IP)
function showAvoidablePatientDetail(marketId, pcpId, pcpName, avoidableCount, costPer, viewType) {
    const marketNames = {
        'atlanta-north': 'Atlanta North',
        'atlanta-south': 'Atlanta South',
        'augusta': 'Augusta',
        'columbus': 'Columbus',
        'macon': 'Macon'
    };

    const marketName = marketNames[marketId] || marketId;
    const isED = viewType === 'ed';
    const viewColor = isED ? '#e74c3c' : '#3498db';

    // Conditions based on type
    const edConditions = [
        { code: 'J06.9', desc: 'Acute upper respiratory infection', category: 'Primary Care Treatable', altCost: 125 },
        { code: 'N39.0', desc: 'Urinary tract infection', category: 'Primary Care Treatable', altCost: 145 },
        { code: 'M54.5', desc: 'Low back pain', category: 'Non-Emergent', altCost: 135 },
        { code: 'J20.9', desc: 'Acute bronchitis', category: 'Primary Care Treatable', altCost: 130 },
        { code: 'H10.9', desc: 'Conjunctivitis', category: 'Primary Care Treatable', altCost: 95 },
        { code: 'L03.90', desc: 'Cellulitis', category: 'Urgent Care Appropriate', altCost: 155 },
        { code: 'S93.40', desc: 'Ankle sprain', category: 'Non-Emergent', altCost: 165 },
        { code: 'R51', desc: 'Headache', category: 'Non-Emergent', altCost: 120 },
        { code: 'J02.9', desc: 'Acute pharyngitis', category: 'Primary Care Treatable', altCost: 110 },
        { code: 'K30', desc: 'Dyspepsia', category: 'Non-Emergent', altCost: 140 }
    ];

    const ipConditions = [
        { code: 'E11.65', desc: 'Diabetes with hyperglycemia', category: 'Diabetes-Related', altCost: 3200 },
        { code: 'J44.1', desc: 'COPD with acute exacerbation', category: 'Respiratory', altCost: 3800 },
        { code: 'I50.9', desc: 'Heart failure, unspecified', category: 'Cardiac', altCost: 4200 },
        { code: 'J18.9', desc: 'Bacterial pneumonia', category: 'Respiratory', altCost: 3500 },
        { code: 'I10', desc: 'Essential hypertension', category: 'Cardiac', altCost: 2800 },
        { code: 'J45.901', desc: 'Asthma exacerbation', category: 'Respiratory', altCost: 3000 },
        { code: 'E86.0', desc: 'Dehydration', category: 'Metabolic', altCost: 2500 },
        { code: 'N17.9', desc: 'Acute kidney injury', category: 'Renal', altCost: 4000 },
        { code: 'K92.0', desc: 'GI hemorrhage', category: 'GI', altCost: 3600 }
    ];

    const conditions = isED ? edConditions : ipConditions;
    const altLabel = isED ? 'UC Cost' : 'Obs Cost';
    const eventLabel = isED ? 'Visit' : 'Admission';

    // Generate patients
    const patients = [];
    const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson'];

    const numPatients = Math.min(avoidableCount, 25);

    for (let i = 0; i < numPatients; i++) {
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const eventCost = costPer + Math.floor(Math.random() * (isED ? 400 : 4000)) - (isED ? 200 : 2000);
        const savingsPotential = eventCost - condition.altCost;

        patients.push({
            id: `P${100000 + Math.floor(Math.random() * 900000)}`,
            firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
            lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
            dob: `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/${1940 + Math.floor(Math.random() * 50)}`,
            eventDate: `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/2024`,
            condition: condition,
            eventCost: eventCost,
            savingsPotential: savingsPotential,
            facility: isED ?
                ['Piedmont Atlanta ED', 'Piedmont Fayette ED', 'Piedmont Henry ED', 'Piedmont Newnan ED'][Math.floor(Math.random() * 4)] :
                ['Piedmont Atlanta Hospital', 'Piedmont Fayette Hospital', 'Piedmont Henry Hospital', 'Piedmont Newnan Hospital'][Math.floor(Math.random() * 4)],
            eventCount: Math.floor(Math.random() * (isED ? 4 : 3)) + 1,
            los: isED ? null : Math.floor(Math.random() * 4) + 2
        });
    }

    patients.sort((a, b) => b.savingsPotential - a.savingsPotential);
    const totalPatientSavings = patients.reduce((sum, p) => sum + p.savingsPotential, 0);

    let modalBody = `
        <h2>Patient Detail - Avoidable ${isED ? 'ED Visits' : 'IP Admissions'}</h2>
        <p class="provider-summary">${pcpName} | ${marketName} Market</p>

        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin: 1.5rem 0; text-align: center;">
            <strong style="color: #856404; font-size: 0.9rem;">⚠️ SYNTHETIC DATA - NOT REAL PHI</strong>
            <div style="color: #856404; font-size: 0.75rem; margin-top: 0.25rem;">Patient-level data is synthetically generated for demonstration purposes only.</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">Patients Shown</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #2c3e50;">${numPatients}</div>
                <div style="font-size: 0.7rem; color: #888;">of ${avoidableCount} total</div>
            </div>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">Avg ${eventLabel} Cost</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: ${viewColor};">$${costPer.toLocaleString()}</div>
            </div>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase;">Avg ${altLabel}</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #27ae60;">$${isED ? '150' : '3,500'}</div>
            </div>
            <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 1rem; border-radius: 8px; text-align: center;">
                <div style="font-size: 0.75rem; color: #155724; text-transform: uppercase;">Total Savings</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #155724;">$${totalPatientSavings.toLocaleString()}</div>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin: 0; font-size: 1rem; color: #2c3e50;">
                <span style="margin-right: 0.5rem;">👥</span>Patient List (Exportable)
            </h3>
            <button class="btn-small" onclick="exportAvoidablePatientList('${pcpId}', '${pcpName}', '${marketName}', '${viewType}')" style="background: #27ae60;">
                📥 Export to CSV
            </button>
        </div>

        <div style="background: white; border-radius: 12px; border: 1px solid #e0e0e0; overflow: hidden;">
            <div style="overflow-x: auto; max-height: 400px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;" id="avoidable-patient-table" data-view-type="${viewType}">
                    <thead style="position: sticky; top: 0; background: #f8f9fa; z-index: 1;">
                        <tr>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Patient ID</th>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Patient Name</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">DOB</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">${eventLabel} Date</th>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Avoidable Condition</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Category</th>
                            ${!isED ? '<th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">LOS</th>' : ''}
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">${eventLabel} Cost</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">${altLabel}</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #d4edda;">Savings</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">${isED ? 'ED Visits' : 'IP Admits'} (12mo)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${patients.map(p => `
                            <tr>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; font-family: monospace; font-size: 0.75rem;">${p.id}</td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee;"><strong>${p.lastName}, ${p.firstName}</strong></td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: center;">${p.dob}</td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: center;">${p.eventDate}</td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee;">
                                    <span style="font-weight: 600;">${p.condition.code}</span> - ${p.condition.desc}
                                </td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: center;">
                                    <span style="background: ${getCategoryColor(p.condition.category)}; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem;">${p.condition.category}</span>
                                </td>
                                ${!isED ? `<td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: center;">${p.los} days</td>` : ''}
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: right; color: ${viewColor}; font-weight: 600;">$${p.eventCost.toLocaleString()}</td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: right; color: #27ae60;">$${p.condition.altCost.toLocaleString()}</td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: right; background: #f0fff0; font-weight: 600; color: #155724;">$${p.savingsPotential.toLocaleString()}</td>
                                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #eee; text-align: center; ${p.eventCount >= 3 ? 'color: #e74c3c; font-weight: 700;' : ''}">${p.eventCount}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div style="background: #f8f9fa; border-radius: 12px; padding: 1.25rem; margin-top: 1.5rem; border: 1px solid #e0e0e0;">
            <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: #2c3e50;">
                <svg style="width:16px;height:16px;vertical-align:-3px;margin-right:0.5rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>Data Definitions
            </h4>
            <div style="font-size: 0.8rem; color: #5a6c7d;">
                ${isED ?
                    '<strong>NYU ED Algorithm:</strong> Classifies ED visits by urgency and treatability. Categories: Primary Care Treatable (routine), Urgent Care Appropriate (minor acute), Non-Emergent (could wait).' :
                    '<strong>AHRQ PQIs:</strong> Prevention Quality Indicators identify hospitalizations potentially preventable with effective outpatient care. Categories include chronic disease complications (diabetes, CHF, COPD) and acute conditions (pneumonia, dehydration).'
                }
            </div>
        </div>

        <div style="margin-top: 1rem; text-align: center;">
            <button class="btn-small" onclick="drillDownAvoidableMarket('${marketId}')" style="background: #6c757d;">
                ← Back to ${marketName} Summary
            </button>
        </div>
    `;

    showModal(modalBody);
}

// Get category color for patient detail
function getCategoryColor(category) {
    const colors = {
        'Primary Care Treatable': '#d4edda',
        'Urgent Care Appropriate': '#fff3cd',
        'Non-Emergent': '#e2e3e5',
        'Diabetes-Related': '#cce5ff',
        'Respiratory': '#d1ecf1',
        'Cardiac': '#f8d7da',
        'Metabolic': '#e2e3e5',
        'Renal': '#fff3cd',
        'GI': '#d6d8db'
    };
    return colors[category] || '#e2e3e5';
}

// Export avoidable patient list to CSV
function exportAvoidablePatientList(pcpId, pcpName, marketName, viewType) {
    const table = document.getElementById('avoidable-patient-table');
    if (!table) {
        alert('No patient data to export');
        return;
    }

    const isED = viewType === 'ed';
    const eventLabel = isED ? 'Visit' : 'Admission';
    const altLabel = isED ? 'UC Cost' : 'Obs Cost';

    let headers = ['Patient ID', 'Patient Name', 'DOB', `${eventLabel} Date`, 'ICD-10 Code', 'Avoidable Condition', 'Category'];
    if (!isED) headers.push('LOS');
    headers.push(`${eventLabel} Cost`, altLabel, 'Savings Potential', `${isED ? 'ED Visits' : 'IP Admits'} (12mo)`);

    let csv = headers.join(',') + '\n';

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const values = [];
        cells.forEach((cell, idx) => {
            let val = cell.textContent.trim();
            if (val.includes(',') || val.includes('"')) {
                val = `"${val.replace(/"/g, '""')}"`;
            } else {
                val = `"${val}"`;
            }
            values.push(val);
        });
        csv += values.join(',') + '\n';
    });

    csv += '\n\n"--- METHODOLOGY ---"\n';
    csv += `"Avoidable ${isED ? 'ED Visit' : 'IP Admission'} Definition: ${isED ? 'NYU ED Algorithm - conditions treatable in lower-cost settings' : 'AHRQ PQIs - hospitalizations preventable with effective outpatient care'}"\n`;
    csv += `"${eventLabel} Cost: Total allowed amount including all fees"\n`;
    csv += `"Savings: ${eventLabel} Cost - ${isED ? 'Urgent Care' : 'Observation'} Cost"\n`;
    csv += `"Report Generated: ${new Date().toLocaleString()}"\n`;
    csv += `"Attributed PCP: ${pcpName}"\n`;
    csv += `"Market: ${marketName}"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const filename = `avoidable_${viewType}_patients_${pcpId}_${new Date().toISOString().split('T')[0]}.csv`;

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Make functions globally available
window.setAvoidableView = setAvoidableView;
window.drillDownAvoidableMarket = drillDownAvoidableMarket;
window.switchModalAvoidableView = switchModalAvoidableView;
window.showAvoidablePatientDetail = showAvoidablePatientDetail;
window.exportAvoidablePatientList = exportAvoidablePatientList;

// ==============================================
// END AVOIDABLE UTILIZATION SECTION
// ==============================================

function drillDownPCPLeakage(pcpId) {
    // Show Sankey diagram for this PCP
    createSankeyDiagram(pcpId);
}

// Show detailed leakage breakdown for an attributed provider (PCP)
function showProviderLeakageDetail(providerId) {
    const providerData = {
        'martinez': {
            name: 'Dr. Robert Martinez',
            market: 'Augusta',
            patients: 1247,
            totalSpend: 14234887,
            oonSpend: 5892334,
            leakagePercent: 41.4,
            facilities: [
                { name: 'Emory St. Joseph\'s Hospital', type: 'Acute Care', spend: 2134556, services: 'Cardiac Surgery', encounters: 89, electivePct: 78 },
                { name: 'Northside Hospital', type: 'Acute Care', spend: 1456223, services: 'Orthopedic Surgery', encounters: 67, electivePct: 85 },
                { name: 'Peachtree Advanced Imaging', type: 'Imaging Center', spend: 987334, services: 'MRI / CT Scans', encounters: 234, electivePct: 92 },
                { name: 'WellStar Kennestone', type: 'Acute Care', spend: 723445, services: 'Emergency Services', encounters: 45, electivePct: 12 },
                { name: 'Grady Memorial', type: 'Trauma Center', spend: 590776, services: 'Trauma / Emergency', encounters: 28, electivePct: 8 }
            ],
            serviceBreakdown: [
                { service: 'Cardiac Surgery', spend: 2134556, encounters: 89, electiveEnc: 69, nonElectiveEnc: 20 },
                { service: 'Orthopedic Surgery', spend: 1456223, encounters: 67, electiveEnc: 57, nonElectiveEnc: 10 },
                { service: 'Imaging (MRI/CT)', spend: 987334, encounters: 234, electiveEnc: 215, nonElectiveEnc: 19 },
                { service: 'Emergency Services', spend: 723445, encounters: 45, electiveEnc: 5, nonElectiveEnc: 40 }
            ]
        },
        'williams': {
            name: 'Dr. Amanda Williams',
            market: 'Atlanta South',
            patients: 1523,
            totalSpend: 17892441,
            oonSpend: 7234556,
            leakagePercent: 40.4,
            facilities: [
                { name: 'Northside Hospital Atlanta', type: 'Acute Care', spend: 2567889, services: 'Orthopedic Surgery', encounters: 112, electivePct: 88 },
                { name: 'Emory University Hospital', type: 'Academic Medical', spend: 1923445, services: 'Complex Surgery', encounters: 56, electivePct: 45 },
                { name: 'Peachtree Advanced Imaging', type: 'Imaging Center', spend: 1234556, services: 'MRI / CT Scans', encounters: 289, electivePct: 95 },
                { name: 'Atlanta Spine Center', type: 'Specialty', spend: 876334, services: 'Spine Surgery', encounters: 34, electivePct: 82 },
                { name: 'WellStar Kennestone', type: 'Acute Care', spend: 632332, services: 'Emergency Services', encounters: 67, electivePct: 15 }
            ],
            serviceBreakdown: [
                { service: 'Orthopedic Surgery', spend: 2567889, encounters: 112, electiveEnc: 98, nonElectiveEnc: 14 },
                { service: 'Complex Surgery', spend: 1923445, encounters: 56, electiveEnc: 25, nonElectiveEnc: 31 },
                { service: 'Imaging (MRI/CT)', spend: 1234556, encounters: 289, electiveEnc: 275, nonElectiveEnc: 14 },
                { service: 'Spine Surgery', spend: 876334, encounters: 34, electiveEnc: 28, nonElectiveEnc: 6 },
                { service: 'Emergency Services', spend: 632332, encounters: 67, electiveEnc: 10, nonElectiveEnc: 57 }
            ]
        },
        'chen': {
            name: 'Dr. Michael Chen',
            market: 'Atlanta South',
            patients: 1389,
            totalSpend: 15667223,
            oonSpend: 6123445,
            leakagePercent: 39.1,
            facilities: [
                { name: 'Piedmont Heart Institute', type: 'Specialty', spend: 2123445, services: 'Cardiac Care', encounters: 78, electivePct: 72 },
                { name: 'Emory St. Joseph\'s Hospital', type: 'Acute Care', spend: 1567889, services: 'Cardiac Surgery', encounters: 45, electivePct: 65 },
                { name: 'Peachtree Advanced Imaging', type: 'Imaging Center', spend: 1234556, services: 'MRI / CT Scans', encounters: 312, electivePct: 94 },
                { name: 'Northside Hospital', type: 'Acute Care', spend: 678223, services: 'General Surgery', encounters: 34, electivePct: 68 },
                { name: 'Grady Memorial', type: 'Trauma Center', spend: 519332, services: 'Emergency Services', encounters: 41, electivePct: 10 }
            ],
            serviceBreakdown: [
                { service: 'Cardiac Care', spend: 2123445, encounters: 78, electiveEnc: 56, nonElectiveEnc: 22 },
                { service: 'Cardiac Surgery', spend: 1567889, encounters: 45, electiveEnc: 29, nonElectiveEnc: 16 },
                { service: 'Imaging (MRI/CT)', spend: 1234556, encounters: 312, electiveEnc: 293, nonElectiveEnc: 19 },
                { service: 'General Surgery', spend: 678223, encounters: 34, electiveEnc: 23, nonElectiveEnc: 11 },
                { service: 'Emergency Services', spend: 519332, encounters: 41, electiveEnc: 4, nonElectiveEnc: 37 }
            ]
        },
        'thompson': {
            name: 'Dr. David Thompson',
            market: 'Augusta',
            patients: 982,
            totalSpend: 11234665,
            oonSpend: 4234887,
            leakagePercent: 37.7,
            facilities: [
                { name: 'Augusta University Medical', type: 'Academic Medical', spend: 1567889, services: 'Complex Care', encounters: 67, electivePct: 52 },
                { name: 'Doctors Hospital Augusta', type: 'Acute Care', spend: 1234556, services: 'General Surgery', encounters: 89, electivePct: 76 },
                { name: 'University Imaging Augusta', type: 'Imaging Center', spend: 756334, services: 'MRI / CT Scans', encounters: 187, electivePct: 91 },
                { name: 'Augusta Spine Specialists', type: 'Specialty', spend: 434556, services: 'Spine Care', encounters: 23, electivePct: 85 },
                { name: 'Augusta ER Center', type: 'Emergency', spend: 241552, services: 'Emergency Services', encounters: 34, electivePct: 8 }
            ],
            serviceBreakdown: [
                { service: 'Complex Care', spend: 1567889, encounters: 67, electiveEnc: 35, nonElectiveEnc: 32 },
                { service: 'General Surgery', spend: 1234556, encounters: 89, electiveEnc: 68, nonElectiveEnc: 21 },
                { service: 'Imaging (MRI/CT)', spend: 756334, encounters: 187, electiveEnc: 170, nonElectiveEnc: 17 },
                { service: 'Spine Care', spend: 434556, encounters: 23, electiveEnc: 20, nonElectiveEnc: 3 },
                { service: 'Emergency Services', spend: 241552, encounters: 34, electiveEnc: 3, nonElectiveEnc: 31 }
            ]
        },
        'patel': {
            name: 'Dr. Sarah Patel',
            market: 'Atlanta South',
            patients: 1298,
            totalSpend: 14556332,
            oonSpend: 5334221,
            leakagePercent: 36.6,
            facilities: [
                { name: 'Northside Hospital Atlanta', type: 'Acute Care', spend: 1876554, services: 'Orthopedic Surgery', encounters: 78, electivePct: 89 },
                { name: 'Peachtree Advanced Imaging', type: 'Imaging Center', spend: 1345667, services: 'MRI / CT Scans', encounters: 298, electivePct: 96 },
                { name: 'Emory Midtown', type: 'Acute Care', spend: 987334, services: 'General Surgery', encounters: 45, electivePct: 72 },
                { name: 'Atlanta Orthopedic Institute', type: 'Specialty', spend: 678223, services: 'Joint Replacement', encounters: 34, electivePct: 94 },
                { name: 'WellStar Kennestone', type: 'Acute Care', spend: 446443, services: 'Emergency Services', encounters: 52, electivePct: 14 }
            ],
            serviceBreakdown: [
                { service: 'Orthopedic Surgery', spend: 1876554, encounters: 78, electiveEnc: 69, nonElectiveEnc: 9 },
                { service: 'Imaging (MRI/CT)', spend: 1345667, encounters: 298, electiveEnc: 286, nonElectiveEnc: 12 },
                { service: 'General Surgery', spend: 987334, encounters: 45, electiveEnc: 32, nonElectiveEnc: 13 },
                { service: 'Joint Replacement', spend: 678223, encounters: 34, electiveEnc: 32, nonElectiveEnc: 2 },
                { service: 'Emergency Services', spend: 446443, encounters: 52, electiveEnc: 7, nonElectiveEnc: 45 }
            ]
        }
    };

    const data = providerData[providerId];
    if (!data) return;

    // Calculate totals
    const totalEncounters = data.serviceBreakdown.reduce((sum, s) => sum + s.encounters, 0);
    const totalElective = data.serviceBreakdown.reduce((sum, s) => sum + s.electiveEnc, 0);
    const totalNonElective = data.serviceBreakdown.reduce((sum, s) => sum + s.nonElectiveEnc, 0);
    const electivePct = ((totalElective / totalEncounters) * 100).toFixed(1);
    const nonElectivePct = ((totalNonElective / totalEncounters) * 100).toFixed(1);

    let modalContent = `
        <div class="leakage-detail-modal">
            <div class="modal-header" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; margin: -1.5rem -1.5rem 1.5rem -1.5rem;">
                <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">${data.name} - Leakage Detail</h2>
                <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">${data.market} Market | ${data.patients.toLocaleString()} Patients</p>
            </div>

            <!-- Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase;">Total Cost</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #2c3e50;">$${(data.totalSpend / 1000000).toFixed(1)}M</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: #ffeaea; border-radius: 8px;">
                    <div style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase;">OON Cost</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #e74c3c;">$${(data.oonSpend / 1000000).toFixed(1)}M</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: #ffeaea; border-radius: 8px;">
                    <div style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase;">Leakage %</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #e74c3c;">${data.leakagePercent}%</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase;">Total Encounters</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #2c3e50;">${totalEncounters.toLocaleString()}</div>
                </div>
            </div>

            <!-- Elective vs Non-Elective Breakdown -->
            <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: #2c3e50;">Elective vs Non-Elective Encounters</h4>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="flex: 1; height: 24px; background: #e9ecef; border-radius: 12px; overflow: hidden; position: relative;">
                        <div style="width: ${electivePct}%; height: 100%; background: linear-gradient(90deg, #27ae60, #2ecc71); display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; color: white; font-weight: 600; font-size: 0.8rem;">${electivePct}%</div>
                    </div>
                    <div style="display: flex; gap: 1.5rem; font-size: 0.85rem;">
                        <div><span style="display: inline-block; width: 12px; height: 12px; background: #27ae60; border-radius: 2px; margin-right: 4px;"></span>Elective: ${totalElective}</div>
                        <div><span style="display: inline-block; width: 12px; height: 12px; background: #e74c3c; border-radius: 2px; margin-right: 4px;"></span>Non-Elective: ${totalNonElective}</div>
                    </div>
                </div>
            </div>

            <!-- Facility Breakdown Table -->
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 1rem 0; color: #2c3e50;">OON Cost by Facility</h4>
                <table class="data-table" style="font-size: 0.85rem;">
                    <thead>
                        <tr>
                            <th>Facility</th>
                            <th>Type</th>
                            <th>OON Cost</th>
                            <th>Primary Services</th>
                            <th>Encounters</th>
                            <th>% Elective</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    data.facilities.forEach(facility => {
        const electiveClass = facility.electivePct >= 70 ? 'good' : facility.electivePct <= 30 ? 'bad' : '';
        modalContent += `
            <tr>
                <td><strong>${facility.name}</strong></td>
                <td>${facility.type}</td>
                <td class="bad">$${facility.spend.toLocaleString()}</td>
                <td>${facility.services}</td>
                <td>${facility.encounters}</td>
                <td class="${electiveClass}">${facility.electivePct}%</td>
            </tr>
        `;
    });

    modalContent += `
                    </tbody>
                </table>
            </div>

            <!-- Service Line Breakdown Table -->
            <div style="margin-bottom: 1rem;">
                <h4 style="margin: 0 0 1rem 0; color: #2c3e50;">Service Line Breakdown</h4>
                <table class="data-table" style="font-size: 0.85rem;">
                    <thead>
                        <tr>
                            <th>Service Line</th>
                            <th>OON Cost</th>
                            <th>Total Encounters</th>
                            <th>Elective</th>
                            <th>Non-Elective</th>
                            <th>% Elective</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    data.serviceBreakdown.forEach(service => {
        const pct = ((service.electiveEnc / service.encounters) * 100).toFixed(0);
        const electiveClass = pct >= 70 ? 'good' : pct <= 30 ? 'bad' : '';
        modalContent += `
            <tr>
                <td><strong>${service.service}</strong></td>
                <td class="bad">$${service.spend.toLocaleString()}</td>
                <td>${service.encounters}</td>
                <td>${service.electiveEnc}</td>
                <td>${service.nonElectiveEnc}</td>
                <td class="${electiveClass}">${pct}%</td>
            </tr>
        `;
    });

    modalContent += `
                    </tbody>
                </table>
            </div>

        </div>
    `;

    showModal(modalContent);
}

// Show detailed leakage breakdown for a facility
function showFacilityLeakageDetail(facilityId) {
    const facilityData = {
        'emory-stjosephs': {
            name: 'Emory St. Joseph\'s Hospital',
            type: 'Acute Care Hospital',
            totalOonSpend: 14892334,
            patientCount: 1456,
            primaryService: 'Cardiac Surgery',
            electivePct: 78,
            encounters: 2134,
            renderingProviders: [
                { name: 'Dr. James Wilson, MD', specialty: 'Cardiothoracic Surgery', spend: 4234556, encounters: 312, electivePct: 82, attributedPCPs: ['Dr. Robert Martinez', 'Dr. Amanda Williams', 'Dr. Michael Chen'] },
                { name: 'Dr. Sarah Kim, MD', specialty: 'Interventional Cardiology', spend: 3567889, encounters: 456, electivePct: 75, attributedPCPs: ['Dr. Sarah Patel', 'Dr. Robert Martinez', 'Dr. David Thompson'] },
                { name: 'Dr. Michael Torres, MD', specialty: 'Cardiac Anesthesiology', spend: 2234556, encounters: 389, electivePct: 85, attributedPCPs: ['Dr. Amanda Williams', 'Dr. Michael Chen'] },
                { name: 'Dr. Elizabeth Chen, MD', specialty: 'Cardiac Surgery', spend: 1987334, encounters: 287, electivePct: 79, attributedPCPs: ['Dr. Robert Martinez', 'Dr. Sarah Patel', 'Dr. David Thompson'] },
                { name: 'Dr. Robert Anderson, MD', specialty: 'Vascular Surgery', spend: 1456778, encounters: 234, electivePct: 71, attributedPCPs: ['Dr. Michael Chen', 'Dr. Amanda Williams'] },
                { name: 'Dr. Jennifer Martinez, MD', specialty: 'Cardiac Imaging', spend: 1411221, encounters: 456, electivePct: 92, attributedPCPs: ['Dr. Sarah Patel', 'Dr. Robert Martinez', 'Dr. Amanda Williams'] }
            ],
            serviceBreakdown: [
                { service: 'Cardiac Surgery', spend: 5678900, encounters: 423, electiveEnc: 345, nonElectiveEnc: 78 },
                { service: 'Interventional Cardiology', spend: 3456789, encounters: 567, electiveEnc: 425, nonElectiveEnc: 142 },
                { service: 'Cardiac Imaging', spend: 2345678, encounters: 634, electiveEnc: 583, nonElectiveEnc: 51 },
                { service: 'Cardiac Rehab', spend: 1234567, encounters: 312, electiveEnc: 289, nonElectiveEnc: 23 },
                { service: 'Emergency Cardiac Care', spend: 2176400, encounters: 198, electiveEnc: 23, nonElectiveEnc: 175 }
            ]
        },
        'northside-atlanta': {
            name: 'Northside Hospital Atlanta',
            type: 'Acute Care Hospital',
            totalOonSpend: 11234556,
            patientCount: 1823,
            primaryService: 'Orthopedic Surgery',
            electivePct: 85,
            encounters: 2567,
            renderingProviders: [
                { name: 'Dr. Robert Chen, MD', specialty: 'Orthopedic Surgery', spend: 3456789, encounters: 423, electivePct: 89, attributedPCPs: ['Dr. Amanda Williams', 'Dr. Sarah Patel', 'Dr. Michael Chen'] },
                { name: 'Dr. Lisa Patel, MD', specialty: 'Sports Medicine', spend: 2345678, encounters: 567, electivePct: 92, attributedPCPs: ['Dr. Sarah Patel', 'Dr. Amanda Williams'] },
                { name: 'Dr. David Brown, MD', specialty: 'Joint Replacement', spend: 2123456, encounters: 389, electivePct: 95, attributedPCPs: ['Dr. Michael Chen', 'Dr. Amanda Williams', 'Dr. Robert Martinez'] },
                { name: 'Dr. Amanda Wilson, MD', specialty: 'Spine Surgery', spend: 1567889, encounters: 287, electivePct: 78, attributedPCPs: ['Dr. Sarah Patel', 'Dr. David Thompson'] },
                { name: 'Dr. Michael Lee, MD', specialty: 'Hand Surgery', spend: 987334, encounters: 456, electivePct: 88, attributedPCPs: ['Dr. Amanda Williams', 'Dr. Michael Chen', 'Dr. Sarah Patel'] },
                { name: 'Dr. Sarah Thompson, MD', specialty: 'Physical Therapy', spend: 753410, encounters: 445, electivePct: 94, attributedPCPs: ['Dr. Sarah Patel', 'Dr. Amanda Williams'] }
            ],
            serviceBreakdown: [
                { service: 'Joint Replacement', spend: 3789000, encounters: 312, electiveEnc: 296, nonElectiveEnc: 16 },
                { service: 'Sports Medicine', spend: 2456789, encounters: 678, electiveEnc: 624, nonElectiveEnc: 54 },
                { service: 'Spine Surgery', spend: 2123456, encounters: 234, electiveEnc: 183, nonElectiveEnc: 51 },
                { service: 'General Orthopedics', spend: 1678900, encounters: 789, electiveEnc: 670, nonElectiveEnc: 119 },
                { service: 'Physical Therapy', spend: 1186411, encounters: 554, electiveEnc: 521, nonElectiveEnc: 33 }
            ]
        },
        'wellstar-kennestone': {
            name: 'WellStar Kennestone Hospital',
            type: 'Acute Care Hospital',
            totalOonSpend: 9456778,
            patientCount: 2134,
            primaryService: 'Emergency Services',
            electivePct: 22,
            encounters: 3456,
            renderingProviders: [
                { name: 'Dr. Amanda Martinez, MD', specialty: 'Emergency Medicine', spend: 2567889, encounters: 856, electivePct: 15, attributedPCPs: ['Dr. Robert Martinez', 'Dr. David Thompson', 'Dr. Amanda Williams'] },
                { name: 'Dr. John Davis, MD', specialty: 'Trauma Surgery', spend: 2123456, encounters: 389, electivePct: 8, attributedPCPs: ['Dr. David Thompson', 'Dr. Robert Martinez'] },
                { name: 'Dr. Emily Wong, MD', specialty: 'Critical Care', spend: 1876543, encounters: 567, electivePct: 12, attributedPCPs: ['Dr. Amanda Williams', 'Dr. Robert Martinez', 'Dr. Sarah Patel'] },
                { name: 'Dr. Kevin Rodriguez, MD', specialty: 'General Surgery', spend: 1345678, encounters: 423, electivePct: 45, attributedPCPs: ['Dr. Michael Chen', 'Dr. Sarah Patel', 'Dr. Amanda Williams'] },
                { name: 'Dr. Rachel Kim, MD', specialty: 'Internal Medicine', spend: 987654, encounters: 678, electivePct: 35, attributedPCPs: ['Dr. Sarah Patel', 'Dr. Michael Chen'] },
                { name: 'Dr. Thomas Brown, MD', specialty: 'Neurology', spend: 555558, encounters: 543, electivePct: 28, attributedPCPs: ['Dr. David Thompson', 'Dr. Robert Martinez', 'Dr. Amanda Williams'] }
            ],
            serviceBreakdown: [
                { service: 'Emergency Services', spend: 3234567, encounters: 1234, electiveEnc: 98, nonElectiveEnc: 1136 },
                { service: 'Trauma Surgery', spend: 2345678, encounters: 456, electiveEnc: 36, nonElectiveEnc: 420 },
                { service: 'Critical Care', spend: 1987654, encounters: 678, electiveEnc: 81, nonElectiveEnc: 597 },
                { service: 'General Surgery', spend: 1234567, encounters: 567, electiveEnc: 255, nonElectiveEnc: 312 },
                { service: 'Medical Admission', spend: 654312, encounters: 521, electiveEnc: 287, nonElectiveEnc: 234 }
            ]
        },
        'peachtree-imaging': {
            name: 'Peachtree Advanced Imaging',
            type: 'Imaging Center',
            totalOonSpend: 8923441,
            patientCount: 3421,
            primaryService: 'MRI / CT Scans',
            electivePct: 94,
            encounters: 5678,
            renderingProviders: [
                { name: 'Dr. Kevin Lee, MD', specialty: 'Diagnostic Radiology', spend: 3234567, encounters: 1856, electivePct: 96, attributedPCPs: ['Dr. Amanda Williams', 'Dr. Sarah Patel', 'Dr. Michael Chen'] },
                { name: 'Dr. Jennifer Smith, MD', specialty: 'Neuroradiology', spend: 2567889, encounters: 1234, electivePct: 93, attributedPCPs: ['Dr. Michael Chen', 'Dr. Robert Martinez', 'Dr. David Thompson'] },
                { name: 'Dr. Mark Johnson, MD', specialty: 'Musculoskeletal Radiology', spend: 1876543, encounters: 1123, electivePct: 95, attributedPCPs: ['Dr. Sarah Patel', 'Dr. Amanda Williams'] },
                { name: 'Dr. Linda Chen, MD', specialty: 'Body Imaging', spend: 1244442, encounters: 1465, electivePct: 92, attributedPCPs: ['Dr. Robert Martinez', 'Dr. Sarah Patel', 'Dr. Amanda Williams'] }
            ],
            serviceBreakdown: [
                { service: 'MRI Scans', spend: 4123456, encounters: 2345, electiveEnc: 2228, nonElectiveEnc: 117 },
                { service: 'CT Scans', spend: 2987654, encounters: 1987, electiveEnc: 1868, nonElectiveEnc: 119 },
                { service: 'X-Ray', spend: 1234567, encounters: 987, electiveEnc: 918, nonElectiveEnc: 69 },
                { service: 'Ultrasound', spend: 577764, encounters: 359, electiveEnc: 341, nonElectiveEnc: 18 }
            ]
        },
        'grady-memorial': {
            name: 'Grady Memorial Hospital',
            type: 'Trauma Center',
            totalOonSpend: 7234112,
            patientCount: 892,
            primaryService: 'Trauma / Emergency',
            electivePct: 12,
            encounters: 1678,
            renderingProviders: [
                { name: 'Dr. Marcus Johnson, MD', specialty: 'Trauma Surgery', spend: 2345678, encounters: 423, electivePct: 8, attributedPCPs: ['Dr. Robert Martinez', 'Dr. David Thompson', 'Dr. Amanda Williams'] },
                { name: 'Dr. Patricia Williams, MD', specialty: 'Emergency Medicine', spend: 1987654, encounters: 567, electivePct: 10, attributedPCPs: ['Dr. David Thompson', 'Dr. Robert Martinez'] },
                { name: 'Dr. Steven Rodriguez, MD', specialty: 'Neurosurgery', spend: 1567890, encounters: 234, electivePct: 15, attributedPCPs: ['Dr. Amanda Williams', 'Dr. Michael Chen', 'Dr. Robert Martinez'] },
                { name: 'Dr. Angela Davis, MD', specialty: 'Critical Care', spend: 987654, encounters: 289, electivePct: 12, attributedPCPs: ['Dr. Robert Martinez', 'Dr. David Thompson'] },
                { name: 'Dr. Michael Thomas, MD', specialty: 'Orthopedic Trauma', spend: 345236, encounters: 165, electivePct: 18, attributedPCPs: ['Dr. David Thompson', 'Dr. Robert Martinez', 'Dr. Sarah Patel'] }
            ],
            serviceBreakdown: [
                { service: 'Trauma Surgery', spend: 2789000, encounters: 456, electiveEnc: 36, nonElectiveEnc: 420 },
                { service: 'Emergency Services', spend: 2123456, encounters: 567, electiveEnc: 57, nonElectiveEnc: 510 },
                { service: 'Neurosurgery', spend: 1234567, encounters: 234, electiveEnc: 35, nonElectiveEnc: 199 },
                { service: 'Critical Care', spend: 654321, encounters: 289, electiveEnc: 35, nonElectiveEnc: 254 },
                { service: 'Orthopedic Trauma', spend: 432768, encounters: 132, electiveEnc: 24, nonElectiveEnc: 108 }
            ]
        }
    };

    const data = facilityData[facilityId];
    if (!data) return;

    // Calculate totals
    const totalEncounters = data.serviceBreakdown.reduce((sum, s) => sum + s.encounters, 0);
    const totalElective = data.serviceBreakdown.reduce((sum, s) => sum + s.electiveEnc, 0);
    const totalNonElective = data.serviceBreakdown.reduce((sum, s) => sum + s.nonElectiveEnc, 0);
    const electivePct = ((totalElective / totalEncounters) * 100).toFixed(1);

    let modalContent = `
        <div class="leakage-detail-modal">
            <div class="modal-header" style="background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; margin: -1.5rem -1.5rem 1.5rem -1.5rem;">
                <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">${data.name}</h2>
                <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">${data.type} | Primary Service: ${data.primaryService}</p>
            </div>

            <!-- Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="text-align: center; padding: 1rem; background: #ffeaea; border-radius: 8px;">
                    <div style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase;">Total OON Cost</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #e74c3c;">$${(data.totalOonSpend / 1000000).toFixed(1)}M</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase;">Patient Count</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #2c3e50;">${data.patientCount.toLocaleString()}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase;">Total Encounters</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #2c3e50;">${totalEncounters.toLocaleString()}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: ${data.electivePct >= 70 ? '#e8f5e9' : data.electivePct <= 30 ? '#ffeaea' : '#fff8e6'}; border-radius: 8px;">
                    <div style="font-size: 0.75rem; color: #7f8c8d; text-transform: uppercase;">% Elective</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${data.electivePct >= 70 ? '#27ae60' : data.electivePct <= 30 ? '#e74c3c' : '#f39c12'};">${electivePct}%</div>
                </div>
            </div>

            <!-- Elective vs Non-Elective Breakdown -->
            <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; color: #2c3e50;">Elective vs Non-Elective Encounters</h4>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="flex: 1; height: 24px; background: #e9ecef; border-radius: 12px; overflow: hidden; position: relative;">
                        <div style="width: ${electivePct}%; height: 100%; background: linear-gradient(90deg, #27ae60, #2ecc71); display: flex; align-items: center; justify-content: ${electivePct > 15 ? 'flex-end' : 'flex-start'}; padding-right: 8px; padding-left: 8px; color: white; font-weight: 600; font-size: 0.8rem;">${electivePct > 15 ? electivePct + '%' : ''}</div>
                    </div>
                    <div style="display: flex; gap: 1.5rem; font-size: 0.85rem;">
                        <div><span style="display: inline-block; width: 12px; height: 12px; background: #27ae60; border-radius: 2px; margin-right: 4px;"></span>Elective: ${totalElective.toLocaleString()}</div>
                        <div><span style="display: inline-block; width: 12px; height: 12px; background: #e74c3c; border-radius: 2px; margin-right: 4px;"></span>Non-Elective: ${totalNonElective.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <!-- Rendering Providers Table -->
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 1rem 0; color: #2c3e50;">Rendering Providers at This Facility</h4>
                <table class="data-table" style="font-size: 0.85rem;">
                    <thead>
                        <tr>
                            <th>Rendering Provider</th>
                            <th>Specialty</th>
                            <th>OON Cost</th>
                            <th>Encounters</th>
                            <th>% Elective</th>
                            <th>Top Attributed PCPs</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    data.renderingProviders.forEach(provider => {
        const electiveClass = provider.electivePct >= 70 ? 'good' : provider.electivePct <= 30 ? 'bad' : '';
        const pcpList = provider.attributedPCPs.map(pcp => `<div>${pcp}</div>`).join('');
        modalContent += `
            <tr>
                <td><strong>${provider.name}</strong></td>
                <td>${provider.specialty}</td>
                <td class="bad">$${provider.spend.toLocaleString()}</td>
                <td>${provider.encounters}</td>
                <td class="${electiveClass}">${provider.electivePct}%</td>
                <td class="rendering-providers">${pcpList}</td>
            </tr>
        `;
    });

    modalContent += `
                    </tbody>
                </table>
            </div>

            <!-- Service Line Breakdown Table -->
            <div style="margin-bottom: 1rem;">
                <h4 style="margin: 0 0 1rem 0; color: #2c3e50;">Service Line Breakdown</h4>
                <table class="data-table" style="font-size: 0.85rem;">
                    <thead>
                        <tr>
                            <th>Service Line</th>
                            <th>OON Cost</th>
                            <th>Total Encounters</th>
                            <th>Elective</th>
                            <th>Non-Elective</th>
                            <th>% Elective</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    data.serviceBreakdown.forEach(service => {
        const pct = ((service.electiveEnc / service.encounters) * 100).toFixed(0);
        const electiveClass = pct >= 70 ? 'good' : pct <= 30 ? 'bad' : '';
        modalContent += `
            <tr>
                <td><strong>${service.service}</strong></td>
                <td class="bad">$${service.spend.toLocaleString()}</td>
                <td>${service.encounters.toLocaleString()}</td>
                <td>${service.electiveEnc.toLocaleString()}</td>
                <td>${service.nonElectiveEnc.toLocaleString()}</td>
                <td class="${electiveClass}">${pct}%</td>
            </tr>
        `;
    });

    modalContent += `
                    </tbody>
                </table>
            </div>

            <!-- Repatriation Alert -->
            <div class="alert-box ${data.electivePct >= 50 ? 'warning' : 'info'}">
                <h4>${data.electivePct >= 50 ? '<svg style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>High Repatriation Potential' : '<svg style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>Limited Repatriation Potential'}</h4>
                ${data.electivePct >= 50 ? `
                    <p><strong>${electivePct}%</strong> of encounters are elective. Consider network contracting or steering to in-network alternatives:</p>
                    <ul style="margin-top: 0.5rem;">
                        ${data.renderingProviders.filter(p => p.electivePct >= 70).slice(0, 3).map(p =>
                            `<li><strong>${p.name}</strong> (${p.specialty}) - $${(p.spend/1000).toFixed(0)}K, ${p.electivePct}% elective</li>`
                        ).join('')}
                    </ul>
                ` : `
                    <p>This facility primarily handles <strong>non-elective/emergency services</strong> (${(100 - parseFloat(electivePct)).toFixed(1)}% of encounters). Focus on post-acute transitions and follow-up care coordination rather than primary repatriation.</p>
                `}
            </div>
        </div>
    `;

    showModal(modalContent);
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
                <span style="font-size: 1.2rem;">��</span> Revenue Calculation Breakdown
            </h3>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Patient</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">AWV</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Scheduled<br>PCP Visit</th>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Uncoded Dx</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">RAF<br>Current</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">RAF<br>Potential</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">RAF Gap</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #d4edda;">Revenue<br>Opportunity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${patients.map(p => {
                            const rafGap = (p.rafPotential - p.rafCurrent).toFixed(2);
                            const isNotScheduled = p.nextAppt === 'Not scheduled';
                            const formattedDate = isNotScheduled ? 'Not scheduled' : formatDateShort(p.nextAppt);
                            return `
                            <tr>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">
                                    <strong>${p.firstName} ${p.lastName}</strong>
                                    <div style="font-size: 0.7rem; color: #888;">${p.mrn}</div>
                                </td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">
                                    <span style="color: ${p.awvCompleted ? '#27ae60' : '#e74c3c'}; font-weight: 600;">${p.awvCompleted ? '✓' : '✗'}</span>
                                </td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: ${isNotScheduled ? '#e74c3c' : '#27ae60'}; font-weight: ${isNotScheduled ? '600' : '400'};">
                                    ${formattedDate}
                                </td>
                                <td style="padding: 0.75rem; border-bottom: 1px solid #eee; font-size: 0.8rem; color: #f39c12;">
                                    ${p.suspectedHCCs.join('<br>')}
                                </td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">${p.rafCurrent.toFixed(2)}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: #27ae60; font-weight: 600;">${p.rafPotential.toFixed(2)}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: #C84E28; font-weight: 600;">${rafGap}</td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; background: #f0fff0; font-weight: 600; color: #155724;">
                                    $${p.revenueOpp.toLocaleString()}
                                </td>
                            </tr>
                            `;
                        }).join('')}
                        <tr style="background: #f8f9fa; font-weight: 700;">
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;">TOTAL</td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6;">${awvCompleteCount}/${patients.length}</td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6;">${patients.filter(p => p.nextAppt !== 'Not scheduled').length} scheduled</td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; border-top: 2px solid #dee2e6;"></td>
                            <td style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6; color: #C84E28;">${totalRAFGap.toFixed(2)}</td>
                            <td style="padding: 0.75rem; text-align: right; border-top: 2px solid #dee2e6; background: #d4edda; color: #155724; font-size: 1.1rem;">$${totalRevOpp.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
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
    let allPatients = [];
    let headerTitle = '';
    let isAllProviders = (providerId === 'all');

    if (isAllProviders) {
        // Aggregate all patients from all providers
        Object.entries(hccProviderData).forEach(([provId, provider]) => {
            provider.patients.forEach(p => {
                allPatients.push({...p, providerName: provider.name, providerId: provId});
            });
        });
        headerTitle = 'All Providers';
    } else {
        const provider = hccProviderData[providerId];
        if (!provider) {
            showModal(`<h2>Provider Not Found</h2><p>No data available for provider ID: ${providerId}</p>`);
            return;
        }
        allPatients = provider.patients.map(p => ({...p, providerName: provider.name, providerId: providerId}));
        headerTitle = provider.name;
    }

    let filteredPatients = [];
    let listTitle = '';
    let listDescription = '';

    if (filterType === 'awv-incomplete') {
        filteredPatients = allPatients.filter(p => !p.awvCompleted);
        listTitle = 'Patients Without AWV Completion';
        listDescription = 'These patients have not completed their Annual Wellness Visit and are priority for outreach. AWV provides optimal opportunity for comprehensive HCC documentation.';
    } else if (filterType === 'not-scheduled') {
        filteredPatients = allPatients.filter(p => p.nextAppt === 'Not scheduled');
        listTitle = 'Patients Not Scheduled';
        listDescription = 'These patients do not have an upcoming PCP appointment and require immediate scheduling outreach. These represent highest risk for RAF score loss.';
    }

    // Sort by revenue opportunity descending
    filteredPatients.sort((a, b) => b.revenueOpp - a.revenueOpp);

    const totalRevOpp = filteredPatients.reduce((sum, p) => sum + p.revenueOpp, 0);

    const modalBody = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <div>
                <h2 style="margin: 0;">${headerTitle}</h2>
                <p class="provider-summary" style="margin: 0.25rem 0 0 0;">${listTitle}</p>
            </div>
            <button onclick="exportHCCPatientList('${providerId}', '${filterType}')" class="btn btn-primary" style="background: #27ae60; border: none; color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>📥</span> Export to CSV
            </button>
        </div>
        <p style="color: #6c757d; font-size: 0.9rem; margin-bottom: 1.5rem;">${listDescription}</p>

        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; text-align: center;">
            <strong style="color: #856404; font-size: 0.9rem;">⚠️ SYNTHETIC DATA - NOT REAL PHI</strong>
            <div style="color: #856404; font-size: 0.75rem; margin-top: 0.25rem;">Patient-level data is synthetically generated for demonstration purposes only.</div>
        </div>

        <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; border-left: 4px solid #27ae60;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <span style="font-size: 0.85rem; color: #155724;">Total Patients:</span>
                    <span style="font-weight: 700; color: #155724; margin-left: 0.5rem; font-size: 1.3rem;">${filteredPatients.length}</span>
                </div>
                <div>
                    <span style="font-size: 0.85rem; color: #155724;">Total Revenue at Risk:</span>
                    <span style="font-weight: 700; color: #155724; margin-left: 0.5rem; font-size: 1.3rem;">$${totalRevOpp.toLocaleString()}</span>
                </div>
            </div>
        </div>

        ${filteredPatients.length === 0 ? `
            <div style="background: #d4edda; border-radius: 12px; padding: 2rem; text-align: center;">
                <span style="font-size: 2rem;">✓</span>
                <h3 style="color: #155724; margin: 1rem 0 0.5rem 0;">All Caught Up!</h3>
                <p style="color: #155724; margin: 0;">No patients in this category.</p>
            </div>
        ` : `
            <div style="background: white; border-radius: 12px; padding: 1rem; border: 1px solid #e0e0e0; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Patient Name</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">DOB</th>
                            ${isAllProviders ? '<th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">PCP</th>' : ''}
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #fff3cd;">Potential RAF</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Last Visit</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">RAF Gap</th>
                            <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Revenue at Risk</th>
                            ${filterType === 'awv-incomplete' ? '<th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Next Appt</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredPatients.slice(0, 50).map(p => {
                            const rafGap = (p.rafPotential - p.rafCurrent).toFixed(2);
                            const potentialRaf = p.rafPotential.toFixed(2);
                            const isNotScheduled = p.nextAppt === 'Not scheduled';
                            // Generate DOB and Last Visit if not present
                            const dob = p.dob || generateDOB(p.age);
                            const lastVisit = p.lastVisit || generateLastVisit();
                            return `
                            <tr style="cursor: pointer;" onclick="drillDownHCC('${p.providerId}')">
                                <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">
                                    <strong>${p.firstName} ${p.lastName}</strong>
                                </td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; font-family: monospace; color: #6c757d; font-size: 0.8rem;">${dob}</td>
                                ${isAllProviders ? `<td style="padding: 0.75rem; border-bottom: 1px solid #eee; font-size: 0.8rem; color: #495057;">${p.providerName}</td>` : ''}
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; background: #fffbf0; font-weight: 700; color: #856404;">${potentialRaf}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; font-family: monospace; color: #6c757d; font-size: 0.8rem;">${lastVisit}</td>
                                <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: #C84E28; font-weight: 600;">+${rafGap}</td>
                                <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid #eee; font-weight: 600; color: #856404;">$${p.revenueOpp.toLocaleString()}</td>
                                ${filterType === 'awv-incomplete' ? `<td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; color: ${isNotScheduled ? '#e74c3c' : '#27ae60'}; font-weight: ${isNotScheduled ? '600' : '400'};">${isNotScheduled ? 'Not scheduled' : formatDateShort(p.nextAppt)}</td>` : ''}
                            </tr>
                            `;
                        }).join('')}
                        ${filteredPatients.length > 50 ? `
                            <tr style="background: #f8f9fa;">
                                <td colspan="${isAllProviders ? '9' : '8'}" style="padding: 0.75rem; text-align: center; border-top: 2px solid #dee2e6; font-style: italic; color: #6c757d;">
                                    Showing first 50 of ${filteredPatients.length} patients. Export to CSV for complete list.
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `}

        ${!isAllProviders ? `
        <div style="margin-top: 1rem; text-align: center;">
            <button onclick="drillDownHCC('${providerId}')" class="btn btn-secondary" style="background: #6c757d; border: none; color: white; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer;">
                ← Back to Provider Details
            </button>
        </div>
        ` : ''}
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

    const csvContent = generateCSVWithDisclaimer(headers, rows);

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

// ============================================
// RAF SLIDER FILTER FUNCTIONALITY
// ============================================

// AWV Patient Data - extended dataset for the Risk Adjustment tab
const awvPatientData = {
    totalAttributed: 47823,
    awvCompleted: 27929,
    awvIncomplete: 19894,
    notScheduled: 17887,
    scheduledWithAWVDue: 2007,
    missedOpportunityVisits: 4698,
    awvRates: {
        G0402: 160, // Initial Preventive Physical Exam
        G0438: 175, // Initial AWV
        G0439: 118  // Subsequent AWV
    },
    weightedAvgAWV: 150,

    // Regional AWV performance data (aligned with 58.4% overall rate)
    regions: [
        { name: 'Atlanta North', completed: 7016, total: 11892, rate: 59.0, missed: 1185, scheduled: 509 },
        { name: 'Atlanta South', completed: 7100, total: 12456, rate: 57.0, missed: 1560, scheduled: 611 },
        { name: 'Columbus', completed: 4940, total: 8234, rate: 60.0, missed: 821, scheduled: 352 },
        { name: 'Augusta', completed: 4537, total: 7823, rate: 58.0, missed: 712, scheduled: 305 },
        { name: 'Macon', completed: 4377, total: 7418, rate: 59.0, missed: 420, scheduled: 230 }
    ],

    // Top providers for AWV performance
    providers: [
        { name: 'Dr. Sarah Johnson', region: 'Atlanta North', completed: 847, total: 1847, rate: 45.9, missed: 134 },
        { name: 'Dr. Michael Anderson', region: 'Atlanta South', completed: 892, total: 1923, rate: 46.4, missed: 156 },
        { name: 'Dr. Jennifer Brown', region: 'Columbus', completed: 923, total: 1654, rate: 55.8, missed: 89 },
        { name: 'Dr. Raj Patel', region: 'Augusta', completed: 712, total: 1567, rate: 45.4, missed: 143 },
        { name: 'Dr. Susan Kim', region: 'Atlanta North', completed: 834, total: 1432, rate: 58.2, missed: 67 },
        { name: 'Dr. Emily Wilson', region: 'Atlanta South', completed: 1023, total: 1756, rate: 58.3, missed: 78 },
        { name: 'Dr. Carlos Rodriguez', region: 'Macon', completed: 789, total: 1298, rate: 60.8, missed: 45 },
        { name: 'Dr. David Chen', region: 'Columbus', completed: 645, total: 1189, rate: 54.2, missed: 92 }
    ],

    // Sample patient list for drill-downs (expanded with DOB and Last Visit)
    patients: generateAWVPatients(100)
};

// Generate sample patient data with all required fields
function generateAWVPatients(count) {
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    const pcps = ['Dr. Sarah Johnson', 'Dr. Michael Anderson', 'Dr. Jennifer Brown', 'Dr. Raj Patel', 'Dr. Susan Kim', 'Dr. Emily Wilson', 'Dr. Carlos Rodriguez', 'Dr. David Chen'];
    const regions = ['Atlanta North', 'Atlanta South', 'Columbus', 'Augusta', 'Macon'];

    const patients = [];
    for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const age = Math.floor(Math.random() * 35) + 50; // 50-85
        const birthYear = 2026 - age;
        const birthMonth = Math.floor(Math.random() * 12) + 1;
        const birthDay = Math.floor(Math.random() * 28) + 1;
        const dob = `${birthMonth.toString().padStart(2, '0')}/${birthDay.toString().padStart(2, '0')}/${birthYear}`;

        const rafCurrent = parseFloat((Math.random() * 2 + 0.8).toFixed(2));
        const rafGap = parseFloat((Math.random() * 1.5).toFixed(2));
        const rafPotential = parseFloat((rafCurrent + rafGap).toFixed(2));

        // Last visit date - random date in last 6 months
        const lastVisitDays = Math.floor(Math.random() * 180) + 1;
        const lastVisitDate = new Date();
        lastVisitDate.setDate(lastVisitDate.getDate() - lastVisitDays);
        const lastVisit = lastVisitDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

        // Scheduled appointment - some have, some don't
        const hasAppt = Math.random() > 0.45; // 55% not scheduled
        let nextAppt = 'Not scheduled';
        if (hasAppt) {
            const apptDays = Math.floor(Math.random() * 90) + 1;
            const apptDate = new Date();
            apptDate.setDate(apptDate.getDate() + apptDays);
            nextAppt = apptDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        }

        // MyChart status - 65% active, 35% inactive
        const myChartStatus = Math.random() > 0.35 ? 'Active' : 'Inactive';

        patients.push({
            id: `P${100000 + i}`,
            mrn: `MRN${800000 + i}`,
            firstName,
            lastName,
            dob,
            age,
            pcp: pcps[Math.floor(Math.random() * pcps.length)],
            region: regions[Math.floor(Math.random() * regions.length)],
            rafCurrent,
            rafGap,
            rafPotential,
            lastVisit,
            nextAppt,
            awvCompleted: false,
            missedOpportunity: Math.random() > 0.7, // 30% had missed opportunity
            myChartStatus
        });
    }

    // Sort by Potential RAF descending
    return patients.sort((a, b) => b.rafPotential - a.rafPotential);
}

// Function to show AWV patient lists with export capability
function showAWVPatientList(filterType) {
    const data = awvPatientData;

    // Generate more patients if needed (to represent the full population)
    // We'll generate 200 patients to show a representative sample
    const allPatients = generateAWVPatients(200);

    let filteredPatients = [];
    let listTitle = '';
    let listDescription = '';
    let totalCount = 0;

    if (filterType === 'not-scheduled') {
        filteredPatients = allPatients.filter(p => p.nextAppt === 'Not scheduled');
        totalCount = data.notScheduled; // 17,887
        listTitle = 'AWV Incomplete - Not Scheduled';
        listDescription = `Patients who have not completed their Annual Wellness Visit and have no upcoming PCP appointment. These ${totalCount.toLocaleString()} patients require immediate scheduling outreach. Displaying first ${filteredPatients.length} patients sorted by Potential RAF.`;
    } else if (filterType === 'awv-incomplete') {
        filteredPatients = allPatients;
        totalCount = data.awvIncomplete; // 19,894
        listTitle = 'AWV Incomplete';
        listDescription = `All patients who have not completed their Annual Wellness Visit. Total of ${totalCount.toLocaleString()} patients. Displaying first ${filteredPatients.length} patients sorted by Potential RAF.`;
    }

    const avgRAF = (filteredPatients.reduce((sum, p) => sum + p.rafPotential, 0) / filteredPatients.length).toFixed(2);

    const modalBody = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; gap: 1rem; flex-wrap: wrap;">
            <div>
                <h2 style="margin: 0;">${listTitle}</h2>
                <p class="provider-summary" style="margin: 0.25rem 0 0 0;">Risk Adjustment - Annual Wellness Visit Gap List</p>
            </div>
            <button onclick="exportAWVPatientList('${filterType}')" class="btn btn-primary" style="background: #27ae60; border: none; color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; white-space: nowrap;">
                <span>📥</span> Export to CSV
            </button>
        </div>
        <p style="color: #6c757d; font-size: 0.9rem; margin-bottom: 1.5rem;">${listDescription}</p>

        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; text-align: center;">
            <strong style="color: #856404; font-size: 0.9rem;">⚠️ SYNTHETIC DATA - NOT REAL PHI</strong>
            <div style="color: #856404; font-size: 0.75rem; margin-top: 0.25rem;">Patient-level data is synthetically generated for demonstration purposes only.</div>
        </div>

        <div style="background: linear-gradient(135deg, #e8f4fd 0%, #d6ebf7 100%); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; border-left: 4px solid #3498db;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <span style="font-size: 0.85rem; color: #1e5a7d;">Total Patients:</span>
                    <span style="font-weight: 700; color: #1e5a7d; margin-left: 0.5rem; font-size: 1.3rem;">${totalCount.toLocaleString()}</span>
                    <span style="font-size: 0.75rem; color: #1e5a7d; margin-left: 0.5rem;">(showing first ${filteredPatients.length})</span>
                </div>
                <div>
                    <span style="font-size: 0.85rem; color: #1e5a7d;">Avg Potential RAF:</span>
                    <span style="font-weight: 700; color: #1e5a7d; margin-left: 0.5rem; font-size: 1.3rem;">${avgRAF}</span>
                </div>
            </div>
        </div>

        <div style="background: white; border-radius: 12px; padding: 1rem; border: 1px solid #e0e0e0; overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; white-space: nowrap;">Patient Name</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; white-space: nowrap;">MRN</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; white-space: nowrap;">DOB</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; white-space: nowrap;">Age</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; white-space: nowrap;">PCP</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; white-space: nowrap;">Region</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; white-space: nowrap;">RAF Current</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; white-space: nowrap; background: #fff9e8;">RAF Potential</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; white-space: nowrap;">RAF Gap</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; white-space: nowrap;">MyChart</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; white-space: nowrap;">Last Visit</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; white-space: nowrap;">Next Appt</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredPatients.map(p => {
                        const rafGap = (p.rafPotential - p.rafCurrent).toFixed(2);
                        const myChartBadge = p.myChartStatus === 'Active'
                            ? '<span style="background: #d4edda; color: #155724; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Active</span>'
                            : '<span style="background: #f8d7da; color: #721c24; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Inactive</span>';
                        return `
                        <tr>
                            <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">
                                <strong>${p.firstName} ${p.lastName}</strong>
                            </td>
                            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; font-family: monospace; font-size: 0.8rem;">${p.mrn}</td>
                            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">${p.dob}</td>
                            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">${p.age}</td>
                            <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">${p.pcp}</td>
                            <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">${p.region}</td>
                            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; font-weight: 600;">${p.rafCurrent.toFixed(2)}</td>
                            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; font-weight: 700; background: #fffbf0; color: #d97706;">${p.rafPotential.toFixed(2)}</td>
                            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; font-weight: 600; color: ${parseFloat(rafGap) > 1.0 ? '#e74c3c' : '#f39c12'};">${rafGap}</td>
                            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee;">${myChartBadge}</td>
                            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; font-size: 0.8rem;">${p.lastVisit}</td>
                            <td style="padding: 0.75rem; text-align: center; border-bottom: 1px solid #eee; font-size: 0.8rem; ${p.nextAppt === 'Not scheduled' ? 'color: #e74c3c; font-weight: 600;' : ''}">${p.nextAppt}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    showModal(modalBody);
}

// Function to export AWV patient list to CSV
function exportAWVPatientList(filterType) {
    // Generate full patient list (we'll generate more patients for export)
    const allPatients = generateAWVPatients(500);

    let filteredPatients = [];
    let filename = '';

    if (filterType === 'not-scheduled') {
        filteredPatients = allPatients.filter(p => p.nextAppt === 'Not scheduled');
        filename = 'AWV_Not_Scheduled_Patients.csv';
    } else if (filterType === 'awv-incomplete') {
        filteredPatients = allPatients;
        filename = 'AWV_Incomplete_Patients.csv';
    }

    // Create CSV content
    const headers = ['Patient Name', 'MRN', 'DOB', 'Age', 'PCP', 'Region', 'RAF Current', 'RAF Potential', 'RAF Gap', 'MyChart Status', 'Last Visit', 'Next Appointment'];
    const rows = filteredPatients.map(p => [
        `${p.firstName} ${p.lastName}`,
        p.mrn,
        p.dob,
        p.age,
        p.pcp,
        p.region,
        p.rafCurrent.toFixed(2),
        p.rafPotential.toFixed(2),
        (p.rafPotential - p.rafCurrent).toFixed(2),
        p.myChartStatus,
        p.lastVisit,
        p.nextAppt
    ]);

    const csvContent = generateCSVWithDisclaimer(headers, rows);

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

// RAF Slider update function
function updateRAFSlider() {
    const minSlider = document.getElementById('raf-slider-min');
    const maxSlider = document.getElementById('raf-slider-max');

    if (!minSlider || !maxSlider) return;

    let minVal = parseFloat(minSlider.value);
    let maxVal = parseFloat(maxSlider.value);

    // Ensure min doesn't exceed max
    if (minVal > maxVal) {
        const temp = minVal;
        minVal = maxVal;
        maxVal = temp;
        minSlider.value = minVal;
        maxSlider.value = maxVal;
    }

    const rangeDisplay = document.getElementById('raf-range-display');
    const resetBtn = document.getElementById('raf-reset-btn');
    const container = document.querySelector('.raf-slider-container');

    const isFiltered = minVal > 0.5 || maxVal < 5.0;

    if (isFiltered) {
        rangeDisplay.textContent = `${minVal.toFixed(1)} — ${maxVal.toFixed(1)}`;
        resetBtn.style.display = 'inline-block';
        container.classList.add('filtered');
    } else {
        rangeDisplay.textContent = '0.5 — 5.0 (All Patients)';
        resetBtn.style.display = 'none';
        container.classList.remove('filtered');
    }

    // Calculate filtered stats
    updateRAFFilteredStats(minVal, maxVal);
}

function updateRAFFilteredStats(minVal, maxVal) {
    // Simulate filtering based on RAF range
    // In production, this would filter actual patient data
    const totalPatients = awvPatientData.totalAttributed;
    const fullRange = 5.0 - 0.5;
    const selectedRange = maxVal - minVal;
    const rangePct = selectedRange / fullRange;

    // Adjusted calculation to simulate realistic distribution
    // Higher RAF patients are fewer, so skew the distribution
    let patientPct = rangePct;
    if (minVal > 2.0) {
        patientPct = rangePct * 0.4; // High RAF patients are rarer
    } else if (minVal > 1.5) {
        patientPct = rangePct * 0.7;
    }

    const filteredPatients = Math.round(totalPatients * patientPct);
    const filteredUncoded = Math.round(2847 * patientPct * (minVal > 1.5 ? 1.5 : 1)); // Higher RAF = more uncoded
    const filteredRevenue = (2.3 * patientPct * (minVal > 1.5 ? 1.5 : 1)).toFixed(1);

    document.getElementById('raf-patients-count').textContent = filteredPatients.toLocaleString();
    document.getElementById('raf-uncoded-count').textContent = filteredUncoded.toLocaleString();
    document.getElementById('raf-revenue-risk').textContent = `$${filteredRevenue}M`;

    // Update AWV counts based on filter
    const awvIncomplete = Math.round(23912 * patientPct);
    const notScheduled = Math.round(21500 * patientPct);

    const awvIncompleteEl = document.getElementById('awv-incomplete-count');
    const notScheduledEl = document.getElementById('not-scheduled-count');

    if (awvIncompleteEl) awvIncompleteEl.textContent = awvIncomplete.toLocaleString();
    if (notScheduledEl) notScheduledEl.textContent = notScheduled.toLocaleString();
}

function resetRAFSlider() {
    const minSlider = document.getElementById('raf-slider-min');
    const maxSlider = document.getElementById('raf-slider-max');

    if (minSlider) minSlider.value = 0.5;
    if (maxSlider) maxSlider.value = 5.0;

    updateRAFSlider();
}

// ============================================
// AWV COMPLIANCE MODAL
// ============================================

function showAWVComplianceModal(section = 'overview') {
    const data = awvPatientData;
    const completionRate = ((data.awvCompleted / data.totalAttributed) * 100).toFixed(1);
    const forecastRevenue = data.scheduledWithAWVDue * data.weightedAvgAWV;
    const missedRevenue = data.missedOpportunityVisits * data.weightedAvgAWV;

    const modalBody = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; gap: 2rem;">
            <div>
                <h2 style="margin: 0;">AWV Compliance & Revenue Analysis</h2>
                <p class="provider-summary" style="margin: 0.25rem 0 0 0;">Annual Wellness Visit Performance Dashboard</p>
            </div>

            <!-- Compact RAF Slider -->
            <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 0.75rem 1rem; min-width: 320px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.75rem; font-weight: 600; color: #495057;">Filter by RAF Score</span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 0.7rem; color: #6c757d;">Range:</span>
                        <span id="awv-raf-range-display" style="font-size: 0.75rem; font-weight: 600; color: #495057;">0.5 — 5.0</span>
                        <button onclick="resetAWVRAFSlider()" id="awv-raf-reset-btn" style="display: none; font-size: 0.65rem; padding: 0.2rem 0.5rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Reset</button>
                    </div>
                </div>
                <div style="position: relative; height: 20px;">
                    <input type="range" id="awv-raf-slider-min" min="0.5" max="5.0" step="0.1" value="0.5"
                           style="position: absolute; width: 100%; pointer-events: none; -webkit-appearance: none; background: transparent;"
                           oninput="updateAWVRAFSlider()">
                    <input type="range" id="awv-raf-slider-max" min="0.5" max="5.0" step="0.1" value="5.0"
                           style="position: absolute; width: 100%; pointer-events: none; -webkit-appearance: none; background: transparent;"
                           oninput="updateAWVRAFSlider()">
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 0.25rem; font-size: 0.65rem; color: #6c757d;">
                    <span>0.5</span>
                    <span>1.5</span>
                    <span>2.5</span>
                    <span>3.5</span>
                    <span>5.0</span>
                </div>
            </div>
        </div>

        <!-- Overview KPIs -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
            <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%); padding: 1rem; border-radius: 10px; text-align: center; border: 1px solid #f39c12;">
                <div style="font-size: 0.8rem; color: #856404; margin-bottom: 0.25rem;">AWV Compliance Rate</div>
                <div id="awv-modal-completion-rate" style="font-size: 2rem; font-weight: 700; color: #856404;">${completionRate}%</div>
                <div id="awv-modal-completion-count" style="font-size: 0.75rem; color: #856404;">${data.awvCompleted.toLocaleString()} / ${data.totalAttributed.toLocaleString()}</div>
            </div>
            <div style="background: #fff3cd; padding: 1rem; border-radius: 10px; text-align: center; border: 1px solid #f39c12;">
                <div style="font-size: 0.8rem; color: #856404; margin-bottom: 0.25rem;">AWV Incomplete</div>
                <div id="awv-modal-incomplete" style="font-size: 2rem; font-weight: 700; color: #856404;">${data.awvIncomplete.toLocaleString()}</div>
                <div style="font-size: 0.75rem; color: #856404;">Patients needing AWV</div>
            </div>
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 1rem; border-radius: 10px; text-align: center; border: 1px solid #3498db;">
                <div style="font-size: 0.8rem; color: #0d47a1; margin-bottom: 0.25rem;">Forecast Opportunity</div>
                <div id="awv-modal-forecast-revenue" style="font-size: 2rem; font-weight: 700; color: #0d47a1;">$${(forecastRevenue / 1000).toFixed(0)}K</div>
                <div id="awv-modal-forecast-scheduled" style="font-size: 0.75rem; color: #0d47a1;">${data.scheduledWithAWVDue.toLocaleString()} scheduled visits</div>
            </div>
            <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); padding: 1rem; border-radius: 10px; text-align: center; border: 1px solid #e74c3c;">
                <div style="font-size: 0.8rem; color: #c62828; margin-bottom: 0.25rem;">Missed Opportunity</div>
                <div id="awv-modal-missed-revenue" style="font-size: 2rem; font-weight: 700; color: #c62828;">$${(missedRevenue / 1000).toFixed(0)}K</div>
                <div id="awv-modal-missed-visits" style="font-size: 0.75rem; color: #c62828;">${data.missedOpportunityVisits.toLocaleString()} visits without AWV</div>
            </div>
        </div>

        <!-- HCPCS Reference Rates -->
        <div style="background: #f8f9fa; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; display: flex; gap: 2rem; flex-wrap: wrap; font-size: 0.85rem;">
            <span style="color: #6c757d;">AWV Reimbursement Rates:</span>
            <span><strong>G0402</strong> (IPPE): $${data.awvRates.G0402}</span>
            <span><strong>G0438</strong> (Initial AWV): $${data.awvRates.G0438}</span>
            <span><strong>G0439</strong> (Subsequent AWV): $${data.awvRates.G0439}</span>
            <span style="color: #667eea;"><strong>Weighted Avg:</strong> $${data.weightedAvgAWV}</span>
        </div>

        <!-- Regional Performance Tables - Three Metric Views -->
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; font-size: 1rem; color: #2c3e50;">Regional Performance by Metric</h3>
                <span style="font-size: 0.75rem; color: #7f8c8d;">Click any region row to drill down to provider detail</span>
            </div>

            <!-- Three-column metric tables -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                <!-- AWV Completion by Region -->
                <div style="border: 1px solid #27ae60; border-radius: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 0.75rem; text-align: center; border-bottom: 1px solid #27ae60;">
                        <div style="font-weight: 700; color: #155724;">AWV Completion</div>
                        <div style="font-size: 0.75rem; color: #155724;">by Region</div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 0.5rem; text-align: left; font-weight: 600;">Region</th>
                                <th style="padding: 0.5rem; text-align: center; font-weight: 600;">Rate</th>
                                <th style="padding: 0.5rem; text-align: center; font-weight: 600;">Count</th>
                            </tr>
                        </thead>
                        <tbody id="awv-completion-region-tbody">
                            ${data.regions.map(r => `
                                <tr onclick="showAWVRegionDrilldown('${r.name}', 'completion')" style="cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s;" onmouseover="this.style.background='#e8f5e9'" onmouseout="this.style.background='white'">
                                    <td style="padding: 0.5rem;"><strong>${r.name}</strong></td>
                                    <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: ${r.rate >= 50 ? '#27ae60' : '#e74c3c'};">${r.rate}%</td>
                                    <td style="padding: 0.5rem; text-align: center; color: #6c757d;">${r.completed.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Forecast Opportunity by Region -->
                <div style="border: 1px solid #3498db; border-radius: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 0.75rem; text-align: center; border-bottom: 1px solid #3498db;">
                        <div style="font-weight: 700; color: #0d47a1;">Forecast Opportunity</div>
                        <div style="font-size: 0.75rem; color: #0d47a1;">by Region</div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 0.5rem; text-align: left; font-weight: 600;">Region</th>
                                <th style="padding: 0.5rem; text-align: center; font-weight: 600;">Revenue</th>
                                <th style="padding: 0.5rem; text-align: center; font-weight: 600;">Scheduled</th>
                            </tr>
                        </thead>
                        <tbody id="awv-forecast-region-tbody">
                            ${data.regions.map(r => `
                                <tr onclick="showAWVRegionDrilldown('${r.name}', 'forecast')" style="cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='white'">
                                    <td style="padding: 0.5rem;"><strong>${r.name}</strong></td>
                                    <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: #3498db;">$${(r.scheduled * data.weightedAvgAWV / 1000).toFixed(0)}K</td>
                                    <td style="padding: 0.5rem; text-align: center; color: #6c757d;">${r.scheduled.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Missed Opportunity by Region -->
                <div style="border: 1px solid #e74c3c; border-radius: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); padding: 0.75rem; text-align: center; border-bottom: 1px solid #e74c3c;">
                        <div style="font-weight: 700; color: #c62828;">Missed Opportunity</div>
                        <div style="font-size: 0.75rem; color: #c62828;">by Region</div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 0.5rem; text-align: left; font-weight: 600;">Region</th>
                                <th style="padding: 0.5rem; text-align: center; font-weight: 600;">Lost $</th>
                                <th style="padding: 0.5rem; text-align: center; font-weight: 600;">Visits</th>
                            </tr>
                        </thead>
                        <tbody id="awv-missed-region-tbody">
                            ${data.regions.map(r => `
                                <tr onclick="showAWVRegionDrilldown('${r.name}', 'missed')" style="cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s;" onmouseover="this.style.background='#ffebee'" onmouseout="this.style.background='white'">
                                    <td style="padding: 0.5rem;"><strong>${r.name}</strong></td>
                                    <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: #e74c3c;">$${(r.missed * data.weightedAvgAWV / 1000).toFixed(0)}K</td>
                                    <td style="padding: 0.5rem; text-align: center; color: #6c757d;">${r.missed.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Regional Charts Section -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1.25rem;">
                <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #2c3e50;">AWV Completion Rate by Region</h3>
                <div style="height: 200px;">
                    <canvas id="awv-region-chart"></canvas>
                </div>
            </div>
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1.25rem;">
                <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #2c3e50;">Annual Wellness Encounters - Rolling 12 Months</h3>
                <div style="height: 200px;">
                    <canvas id="awv-encounters-monthly-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- Provider Chart Section -->
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #2c3e50;">Top Providers by AWV Rate</h3>
            <div style="height: 300px;">
                <canvas id="awv-provider-chart"></canvas>
            </div>
        </div>

    `;

    showModal(modalBody);

    // Initialize charts after modal is shown
    setTimeout(() => {
        initAWVRegionChart(data);
        initAWVEncountersMonthlyChart(data);
        initAWVProviderChart(data);

        // Enable pointer events on the sliders after modal is shown
        const minSlider = document.getElementById('awv-raf-slider-min');
        const maxSlider = document.getElementById('awv-raf-slider-max');
        if (minSlider && maxSlider) {
            minSlider.style.pointerEvents = 'auto';
            maxSlider.style.pointerEvents = 'auto';
        }
    }, 100);
}

// ============================================
// AWV MODAL RAF SLIDER FUNCTIONS
// ============================================

function updateAWVRAFSlider() {
    const minSlider = document.getElementById('awv-raf-slider-min');
    const maxSlider = document.getElementById('awv-raf-slider-max');

    if (!minSlider || !maxSlider) return;

    let minVal = parseFloat(minSlider.value);
    let maxVal = parseFloat(maxSlider.value);

    // Ensure min doesn't exceed max
    if (minVal > maxVal) {
        const temp = minVal;
        minVal = maxVal;
        maxVal = temp;
        minSlider.value = minVal;
        maxSlider.value = maxVal;
    }

    const rangeDisplay = document.getElementById('awv-raf-range-display');
    const resetBtn = document.getElementById('awv-raf-reset-btn');

    const isFiltered = minVal > 0.5 || maxVal < 5.0;

    if (isFiltered) {
        rangeDisplay.textContent = `${minVal.toFixed(1)} — ${maxVal.toFixed(1)}`;
        resetBtn.style.display = 'inline-block';
    } else {
        rangeDisplay.textContent = '0.5 — 5.0';
        resetBtn.style.display = 'none';
    }

    // Update all AWV modal data based on RAF range
    updateAWVModalData(minVal, maxVal);
}

function resetAWVRAFSlider() {
    const minSlider = document.getElementById('awv-raf-slider-min');
    const maxSlider = document.getElementById('awv-raf-slider-max');

    if (minSlider) minSlider.value = 0.5;
    if (maxSlider) maxSlider.value = 5.0;

    updateAWVRAFSlider();
}

// Store chart instances globally
let awvRegionChartInstance = null;
let awvProviderChartInstance = null;

function updateAWVModalData(minVal, maxVal) {
    const data = awvPatientData;
    const fullRange = 5.0 - 0.5;
    const selectedRange = maxVal - minVal;
    const rangePct = selectedRange / fullRange;

    // Adjust for realistic RAF distribution (higher RAF = fewer patients)
    let patientPct = rangePct;
    if (minVal > 2.0) {
        patientPct = rangePct * 0.4; // High RAF patients are rarer
    } else if (minVal > 1.5) {
        patientPct = rangePct * 0.7;
    }

    // Calculate filtered totals
    const filteredTotal = Math.round(data.totalAttributed * patientPct);
    const filteredCompleted = Math.round(data.awvCompleted * patientPct);
    const filteredIncomplete = Math.round(data.awvIncomplete * patientPct);
    const filteredScheduled = Math.round(data.scheduledWithAWVDue * patientPct);
    const filteredMissed = Math.round(data.missedOpportunityVisits * patientPct * (minVal > 1.5 ? 1.2 : 1)); // Higher RAF = more missed

    const filteredCompletionRate = ((filteredCompleted / filteredTotal) * 100).toFixed(1);
    const filteredForecastRevenue = filteredScheduled * data.weightedAvgAWV;
    const filteredMissedRevenue = filteredMissed * data.weightedAvgAWV;

    // Update KPI cards
    const completionRateEl = document.getElementById('awv-modal-completion-rate');
    const completionCountEl = document.getElementById('awv-modal-completion-count');
    const incompleteEl = document.getElementById('awv-modal-incomplete');
    const forecastRevenueEl = document.getElementById('awv-modal-forecast-revenue');
    const forecastScheduledEl = document.getElementById('awv-modal-forecast-scheduled');
    const missedRevenueEl = document.getElementById('awv-modal-missed-revenue');
    const missedVisitsEl = document.getElementById('awv-modal-missed-visits');

    if (completionRateEl) completionRateEl.textContent = `${filteredCompletionRate}%`;
    if (completionCountEl) completionCountEl.textContent = `${filteredCompleted.toLocaleString()} / ${filteredTotal.toLocaleString()}`;
    if (incompleteEl) incompleteEl.textContent = filteredIncomplete.toLocaleString();
    if (forecastRevenueEl) forecastRevenueEl.textContent = `$${(filteredForecastRevenue / 1000).toFixed(0)}K`;
    if (forecastScheduledEl) forecastScheduledEl.textContent = `${filteredScheduled.toLocaleString()} scheduled visits`;
    if (missedRevenueEl) missedRevenueEl.textContent = `$${(filteredMissedRevenue / 1000).toFixed(0)}K`;
    if (missedVisitsEl) missedVisitsEl.textContent = `${filteredMissed.toLocaleString()} visits without AWV`;

    // Filter regional data
    const filteredRegions = data.regions.map(r => ({
        ...r,
        completed: Math.round(r.completed * patientPct),
        total: Math.round(r.total * patientPct),
        scheduled: Math.round(r.scheduled * patientPct),
        missed: Math.round(r.missed * patientPct * (minVal > 1.5 ? 1.2 : 1)),
        rate: r.rate // Keep original rate
    }));

    // Update regional tables
    const completionTbody = document.getElementById('awv-completion-region-tbody');
    const forecastTbody = document.getElementById('awv-forecast-region-tbody');
    const missedTbody = document.getElementById('awv-missed-region-tbody');

    if (completionTbody) {
        completionTbody.innerHTML = filteredRegions.map(r => `
            <tr onclick="showAWVRegionDrilldown('${r.name}', 'completion')" style="cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s;" onmouseover="this.style.background='#e8f5e9'" onmouseout="this.style.background='white'">
                <td style="padding: 0.5rem;"><strong>${r.name}</strong></td>
                <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: ${r.rate >= 50 ? '#27ae60' : '#e74c3c'};">${r.rate}%</td>
                <td style="padding: 0.5rem; text-align: center; color: #6c757d;">${r.completed.toLocaleString()}</td>
            </tr>
        `).join('');
    }

    if (forecastTbody) {
        forecastTbody.innerHTML = filteredRegions.map(r => `
            <tr onclick="showAWVRegionDrilldown('${r.name}', 'forecast')" style="cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='white'">
                <td style="padding: 0.5rem;"><strong>${r.name}</strong></td>
                <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: #3498db;">$${(r.scheduled * data.weightedAvgAWV / 1000).toFixed(0)}K</td>
                <td style="padding: 0.5rem; text-align: center; color: #6c757d;">${r.scheduled.toLocaleString()}</td>
            </tr>
        `).join('');
    }

    if (missedTbody) {
        missedTbody.innerHTML = filteredRegions.map(r => `
            <tr onclick="showAWVRegionDrilldown('${r.name}', 'missed')" style="cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s;" onmouseover="this.style.background='#ffebee'" onmouseout="this.style.background='white'">
                <td style="padding: 0.5rem;"><strong>${r.name}</strong></td>
                <td style="padding: 0.5rem; text-align: center; font-weight: 600; color: #e74c3c;">$${(r.missed * data.weightedAvgAWV / 1000).toFixed(0)}K</td>
                <td style="padding: 0.5rem; text-align: center; color: #6c757d;">${r.missed.toLocaleString()}</td>
            </tr>
        `).join('');
    }

    // Destroy existing charts if they exist
    if (awvRegionChartInstance) {
        awvRegionChartInstance.destroy();
    }
    if (awvProviderChartInstance) {
        awvProviderChartInstance.destroy();
    }

    // Recreate charts with filtered data
    const filteredData = {
        ...data,
        regions: filteredRegions
    };
    initAWVRegionChart(filteredData);
    initAWVProviderChart(filteredData);
}

// ============================================
// AWV REGION DRILL-DOWN
// ============================================

function showAWVRegionDrilldown(regionName, metricType = 'completion') {
    const data = awvPatientData;
    const region = data.regions.find(r => r.name === regionName);
    if (!region) return;

    // Get providers for this region
    const regionProviders = data.providers.filter(p => p.region === regionName);

    // Generate additional provider data for this region (simulate more providers)
    const expandedProviders = generateRegionProviders(regionName, region);

    const metricTitles = {
        completion: 'AWV Completion',
        forecast: 'Forecast Opportunity',
        missed: 'Missed Opportunity'
    };

    const metricColors = {
        completion: { bg: '#d4edda', border: '#27ae60', text: '#155724' },
        forecast: { bg: '#e3f2fd', border: '#3498db', text: '#0d47a1' },
        missed: { bg: '#ffebee', border: '#e74c3c', text: '#c62828' }
    };

    const colors = metricColors[metricType];

    // Calculate region totals based on metric type
    let metricValue, metricDetail;
    if (metricType === 'completion') {
        metricValue = `${region.rate}%`;
        metricDetail = `${region.completed.toLocaleString()} / ${region.total.toLocaleString()} completed`;
    } else if (metricType === 'forecast') {
        metricValue = `$${(region.scheduled * data.weightedAvgAWV / 1000).toFixed(0)}K`;
        metricDetail = `${region.scheduled.toLocaleString()} patients with scheduled visits`;
    } else {
        metricValue = `$${(region.missed * data.weightedAvgAWV / 1000).toFixed(0)}K`;
        metricDetail = `${region.missed.toLocaleString()} visits without AWV billing`;
    }

    const modalBody = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                    <button onclick="showAWVComplianceModal()" style="background: none; border: none; cursor: pointer; font-size: 1.1rem; color: #667eea; padding: 0;">← Back</button>
                    <span style="color: #7f8c8d;">|</span>
                    <span style="color: #7f8c8d; font-size: 0.85rem;">AWV Compliance</span>
                </div>
                <h2 style="margin: 0;">${regionName} - ${metricTitles[metricType]}</h2>
                <p class="provider-summary" style="margin: 0.25rem 0 0 0;">Provider/PCP Performance Detail</p>
            </div>
            <button onclick="exportAWVRegionPatients('${regionName}', '${metricType}')" class="btn-small" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; border: none; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                <span>📥</span> Export Patient List
            </button>
        </div>

        <!-- Region Summary KPIs -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
            <div style="background: linear-gradient(135deg, ${colors.bg} 0%, white 100%); padding: 1rem; border-radius: 10px; text-align: center; border: 1px solid ${colors.border};">
                <div style="font-size: 0.8rem; color: ${colors.text}; margin-bottom: 0.25rem;">${metricTitles[metricType]}</div>
                <div style="font-size: 2rem; font-weight: 700; color: ${colors.text};">${metricValue}</div>
                <div style="font-size: 0.75rem; color: ${colors.text};">${metricDetail}</div>
            </div>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 10px; text-align: center; border: 1px solid #dee2e6;">
                <div style="font-size: 0.8rem; color: #6c757d; margin-bottom: 0.25rem;">Total Attributed</div>
                <div style="font-size: 2rem; font-weight: 700; color: #2c3e50;">${region.total.toLocaleString()}</div>
                <div style="font-size: 0.75rem; color: #6c757d;">patients in region</div>
            </div>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 10px; text-align: center; border: 1px solid #dee2e6;">
                <div style="font-size: 0.8rem; color: #6c757d; margin-bottom: 0.25rem;">Providers</div>
                <div style="font-size: 2rem; font-weight: 700; color: #2c3e50;">${expandedProviders.length}</div>
                <div style="font-size: 0.75rem; color: #6c757d;">PCPs in region</div>
            </div>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 10px; text-align: center; border: 1px solid #dee2e6;">
                <div style="font-size: 0.8rem; color: #6c757d; margin-bottom: 0.25rem;">Avg per Provider</div>
                <div style="font-size: 2rem; font-weight: 700; color: #2c3e50;">${Math.round(region.total / expandedProviders.length)}</div>
                <div style="font-size: 0.75rem; color: #6c757d;">patients/PCP</div>
            </div>
        </div>

        <!-- Provider Performance Table -->
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; font-size: 1rem; color: #2c3e50;">Provider Performance - ${metricTitles[metricType]}</h3>
                <span style="font-size: 0.75rem; color: #7f8c8d;">Click provider row for patient list</span>
            </div>
            <div style="max-height: 350px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead style="position: sticky; top: 0; background: white;">
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6;">Provider</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6;">Panel Size</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6;">AWV Completed</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6;">Completion Rate</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6;">Scheduled</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6;">Forecast $</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6;">Missed Opps</th>
                            <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6;">Missed $</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expandedProviders.map(p => `
                            <tr onclick="showAWVProviderPatients('${p.name}', '${regionName}', '${metricType}')" style="cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                                <td style="padding: 0.75rem;"><strong>${p.name}</strong></td>
                                <td style="padding: 0.75rem; text-align: center;">${p.total.toLocaleString()}</td>
                                <td style="padding: 0.75rem; text-align: center; color: #27ae60;">${p.completed.toLocaleString()}</td>
                                <td style="padding: 0.75rem; text-align: center; font-weight: 600; color: ${p.rate >= 50 ? '#27ae60' : '#e74c3c'};">${p.rate}%</td>
                                <td style="padding: 0.75rem; text-align: center; color: #3498db;">${p.scheduled}</td>
                                <td style="padding: 0.75rem; text-align: center; color: #3498db; font-weight: 500;">$${(p.scheduled * data.weightedAvgAWV / 1000).toFixed(1)}K</td>
                                <td style="padding: 0.75rem; text-align: center; color: #e74c3c;">${p.missed}</td>
                                <td style="padding: 0.75rem; text-align: center; color: #e74c3c; font-weight: 500;">$${(p.missed * data.weightedAvgAWV / 1000).toFixed(1)}K</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Provider Chart -->
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1.25rem;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #2c3e50;">${metricTitles[metricType]} by Provider</h3>
            <div style="height: 250px;">
                <canvas id="region-provider-chart"></canvas>
            </div>
        </div>
    `;

    showModal(modalBody);

    // Initialize provider chart
    setTimeout(() => {
        initRegionProviderChart(expandedProviders, metricType, data.weightedAvgAWV);
    }, 100);
}

// Generate providers for a region
function generateRegionProviders(regionName, region) {
    const providerFirstNames = ['Sarah', 'Michael', 'Jennifer', 'David', 'Emily', 'James', 'Lisa', 'Robert', 'Amanda', 'William', 'Maria', 'Christopher', 'Susan', 'Andrew', 'Karen'];
    const providerLastNames = ['Johnson', 'Anderson', 'Brown', 'Patel', 'Kim', 'Wilson', 'Chen', 'Rodriguez', 'Martinez', 'Thompson', 'Garcia', 'Lee', 'Taylor', 'Harris', 'Clark'];

    // Number of providers based on region size
    const providerCount = Math.ceil(region.total / 800); // ~800 patients per provider
    const providers = [];

    let remainingTotal = region.total;
    let remainingCompleted = region.completed;
    let remainingScheduled = region.scheduled;
    let remainingMissed = region.missed;

    for (let i = 0; i < providerCount; i++) {
        const isLast = i === providerCount - 1;
        const firstName = providerFirstNames[i % providerFirstNames.length];
        const lastName = providerLastNames[(i + regionName.length) % providerLastNames.length];

        // Distribute patients among providers
        const panelSize = isLast ? remainingTotal : Math.floor(remainingTotal / (providerCount - i) * (0.8 + Math.random() * 0.4));
        const completed = isLast ? remainingCompleted : Math.floor(remainingCompleted / (providerCount - i) * (0.7 + Math.random() * 0.6));
        const scheduled = isLast ? remainingScheduled : Math.floor(remainingScheduled / (providerCount - i) * (0.6 + Math.random() * 0.8));
        const missed = isLast ? remainingMissed : Math.floor(remainingMissed / (providerCount - i) * (0.5 + Math.random() * 1.0));

        remainingTotal -= panelSize;
        remainingCompleted -= completed;
        remainingScheduled -= scheduled;
        remainingMissed -= missed;

        providers.push({
            name: `Dr. ${firstName} ${lastName}`,
            region: regionName,
            total: Math.max(panelSize, 100),
            completed: Math.max(completed, 0),
            rate: panelSize > 0 ? parseFloat(((completed / panelSize) * 100).toFixed(1)) : 0,
            scheduled: Math.max(scheduled, 0),
            missed: Math.max(missed, 0)
        });
    }

    // Sort by rate descending
    return providers.sort((a, b) => b.rate - a.rate);
}

// Initialize region provider chart
function initRegionProviderChart(providers, metricType, weightedAvg) {
    const ctx = document.getElementById('region-provider-chart');
    if (!ctx) return;

    let chartData, chartLabel, chartColors;

    if (metricType === 'completion') {
        chartData = providers.map(p => p.rate);
        chartLabel = 'AWV Completion Rate (%)';
        chartColors = providers.map(p => p.rate >= 50 ? 'rgba(39, 174, 96, 0.7)' : 'rgba(231, 76, 60, 0.7)');
    } else if (metricType === 'forecast') {
        chartData = providers.map(p => (p.scheduled * weightedAvg / 1000));
        chartLabel = 'Forecast Opportunity ($K)';
        chartColors = 'rgba(52, 152, 219, 0.7)';
    } else {
        chartData = providers.map(p => (p.missed * weightedAvg / 1000));
        chartLabel = 'Missed Opportunity ($K)';
        chartColors = 'rgba(231, 76, 60, 0.7)';
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: providers.map(p => p.name.replace('Dr. ', '')),
            datasets: [{
                label: chartLabel,
                data: chartData,
                backgroundColor: chartColors,
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#2c3e50',
                    font: { weight: 'bold', size: 10 },
                    anchor: 'end',
                    align: 'right',
                    formatter: (value) => metricType === 'completion' ? value + '%' : '$' + value.toFixed(1) + 'K'
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: { display: true, text: chartLabel }
                }
            }
        }
    });
}

// Show patient list for a specific provider
function showAWVProviderPatients(providerName, regionName, metricType) {
    const data = awvPatientData;

    // Generate patient data for this provider
    const patients = generateProviderPatients(providerName, regionName, metricType, 50);

    const metricTitles = {
        completion: 'AWV Incomplete Patients',
        forecast: 'Scheduled - AWV Due',
        missed: 'Missed AWV Opportunities'
    };

    const modalBody = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                    <button onclick="showAWVRegionDrilldown('${regionName}', '${metricType}')" style="background: none; border: none; cursor: pointer; font-size: 1.1rem; color: #667eea; padding: 0;">← Back to ${regionName}</button>
                </div>
                <h2 style="margin: 0;">${providerName} - ${metricTitles[metricType]}</h2>
                <p class="provider-summary" style="margin: 0.25rem 0 0 0;">Patient-Level Detail</p>
            </div>
            <button onclick="exportProviderPatients('${providerName}', '${regionName}', '${metricType}')" class="btn-small" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; border: none; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                <span>📥</span> Export to CSV
            </button>
        </div>

        <!-- Patient Table -->
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1.25rem; overflow-x: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; font-size: 1rem; color: #2c3e50;">${patients.length} Patients</h3>
                <span style="font-size: 0.75rem; color: #7f8c8d;">Sorted by Potential RAF (highest first)</span>
            </div>
            <div style="max-height: 450px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                    <thead style="position: sticky; top: 0; background: white;">
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.6rem; text-align: left; border-bottom: 2px solid #dee2e6;">MRN</th>
                            <th style="padding: 0.6rem; text-align: left; border-bottom: 2px solid #dee2e6;">Patient Name</th>
                            <th style="padding: 0.6rem; text-align: center; border-bottom: 2px solid #dee2e6;">DOB</th>
                            <th style="padding: 0.6rem; text-align: center; border-bottom: 2px solid #dee2e6;">Age</th>
                            <th style="padding: 0.6rem; text-align: center; border-bottom: 2px solid #dee2e6;">RAF</th>
                            <th style="padding: 0.6rem; text-align: center; border-bottom: 2px solid #dee2e6;">RAF Gap</th>
                            <th style="padding: 0.6rem; text-align: center; border-bottom: 2px solid #dee2e6;">Potential RAF</th>
                            <th style="padding: 0.6rem; text-align: center; border-bottom: 2px solid #dee2e6;">Last Visit</th>
                            <th style="padding: 0.6rem; text-align: center; border-bottom: 2px solid #dee2e6;">Next Appt</th>
                            <th style="padding: 0.6rem; text-align: center; border-bottom: 2px solid #dee2e6;">AWV Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${patients.map(p => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 0.6rem; font-family: monospace; font-size: 0.75rem;">${p.mrn}</td>
                                <td style="padding: 0.6rem;"><strong>${p.lastName}, ${p.firstName}</strong></td>
                                <td style="padding: 0.6rem; text-align: center;">${p.dob}</td>
                                <td style="padding: 0.6rem; text-align: center;">${p.age}</td>
                                <td style="padding: 0.6rem; text-align: center;">${p.rafCurrent.toFixed(2)}</td>
                                <td style="padding: 0.6rem; text-align: center; color: ${p.rafGap > 0 ? '#f39c12' : '#7f8c8d'};">${p.rafGap > 0 ? '+' + p.rafGap.toFixed(2) : '—'}</td>
                                <td style="padding: 0.6rem; text-align: center; font-weight: 600; color: #667eea;">${p.rafPotential.toFixed(2)}</td>
                                <td style="padding: 0.6rem; text-align: center;">${p.lastVisit}</td>
                                <td style="padding: 0.6rem; text-align: center; color: ${p.nextAppt === 'Not scheduled' ? '#e74c3c' : '#27ae60'};">${p.nextAppt}</td>
                                <td style="padding: 0.6rem; text-align: center;">
                                    <span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 500; background: ${p.awvCompleted ? '#d4edda' : '#fff3cd'}; color: ${p.awvCompleted ? '#155724' : '#856404'};">
                                        ${p.awvCompleted ? 'Completed' : metricType === 'missed' ? 'Missed' : 'Incomplete'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    showModal(modalBody);
}

// Generate patient data for a provider
function generateProviderPatients(providerName, regionName, metricType, count) {
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

    const patients = [];
    for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const age = Math.floor(Math.random() * 35) + 50;
        const birthYear = 2026 - age;
        const birthMonth = Math.floor(Math.random() * 12) + 1;
        const birthDay = Math.floor(Math.random() * 28) + 1;
        const dob = `${birthMonth.toString().padStart(2, '0')}/${birthDay.toString().padStart(2, '0')}/${birthYear}`;

        const rafCurrent = parseFloat((Math.random() * 2 + 0.8).toFixed(2));
        const rafGap = parseFloat((Math.random() * 1.5).toFixed(2));
        const rafPotential = parseFloat((rafCurrent + rafGap).toFixed(2));

        const lastVisitDays = Math.floor(Math.random() * 180) + 1;
        const lastVisitDate = new Date();
        lastVisitDate.setDate(lastVisitDate.getDate() - lastVisitDays);
        const lastVisit = lastVisitDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

        let nextAppt = 'Not scheduled';
        let awvCompleted = false;

        if (metricType === 'forecast') {
            // All have scheduled appointments
            const apptDays = Math.floor(Math.random() * 90) + 1;
            const apptDate = new Date();
            apptDate.setDate(apptDate.getDate() + apptDays);
            nextAppt = apptDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        } else if (metricType === 'missed') {
            // Had a visit but no AWV billed
            awvCompleted = false;
        } else {
            // AWV incomplete - mix of scheduled and not
            if (Math.random() > 0.55) {
                const apptDays = Math.floor(Math.random() * 90) + 1;
                const apptDate = new Date();
                apptDate.setDate(apptDate.getDate() + apptDays);
                nextAppt = apptDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
            }
        }

        patients.push({
            mrn: `MRN${800000 + i + Math.floor(Math.random() * 10000)}`,
            firstName,
            lastName,
            dob,
            age,
            pcp: providerName,
            region: regionName,
            rafCurrent,
            rafGap,
            rafPotential,
            lastVisit,
            nextAppt,
            awvCompleted
        });
    }

    return patients.sort((a, b) => b.rafPotential - a.rafPotential);
}

// Export functions for patient lists
function exportAWVRegionPatients(regionName, metricType) {
    const data = awvPatientData;
    const region = data.regions.find(r => r.name === regionName);
    if (!region) return;

    // Generate all patients for the region
    const count = metricType === 'completion' ? region.total - region.completed :
                  metricType === 'forecast' ? region.scheduled : region.missed;

    const patients = generateRegionPatientExport(regionName, metricType, Math.min(count, 500));

    downloadPatientCSV(patients, `AWV_${metricType}_${regionName.replace(/\s+/g, '_')}`);
}

function exportProviderPatients(providerName, regionName, metricType) {
    const patients = generateProviderPatients(providerName, regionName, metricType, 100);
    downloadPatientCSV(patients, `AWV_${metricType}_${providerName.replace(/\s+/g, '_').replace('Dr._', '')}`);
}

function generateRegionPatientExport(regionName, metricType, count) {
    const providers = generateRegionProviders(regionName, awvPatientData.regions.find(r => r.name === regionName));
    const allPatients = [];

    providers.forEach(provider => {
        const providerCount = Math.ceil(count / providers.length);
        const patients = generateProviderPatients(provider.name, regionName, metricType, providerCount);
        allPatients.push(...patients);
    });

    return allPatients.slice(0, count).sort((a, b) => b.rafPotential - a.rafPotential);
}

function downloadPatientCSV(patients, filename) {
    // Create CSV with HEDIS-aligned columns
    const headers = [
        'MRN', 'Last Name', 'First Name', 'DOB', 'Age', 'Gender', 'PCP', 'Region',
        'RAF Score', 'RAF Gap', 'Potential RAF', 'Last Visit', 'Next Appt',
        'AWV Status', 'Phone', 'Address', 'City', 'State', 'ZIP'
    ];

    const rows = patients.map(p => [
        p.mrn,
        p.lastName,
        p.firstName,
        p.dob,
        p.age,
        Math.random() > 0.48 ? 'F' : 'M',
        p.pcp,
        p.region,
        p.rafCurrent.toFixed(3),
        p.rafGap.toFixed(3),
        p.rafPotential.toFixed(3),
        p.lastVisit,
        p.nextAppt,
        p.awvCompleted ? 'Completed' : 'Incomplete',
        `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        `${Math.floor(Math.random() * 9999) + 1} ${['Oak St', 'Maple Ave', 'Main St', 'Park Rd', 'Cedar Ln'][Math.floor(Math.random() * 5)]}`,
        ['Atlanta', 'Marietta', 'Alpharetta', 'Roswell', 'Decatur'][Math.floor(Math.random() * 5)],
        'GA',
        '30' + String(Math.floor(Math.random() * 900) + 100)
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Make functions globally available
window.showAWVRegionDrilldown = showAWVRegionDrilldown;
window.showAWVProviderPatients = showAWVProviderPatients;
window.exportAWVRegionPatients = exportAWVRegionPatients;
window.exportProviderPatients = exportProviderPatients;

function initAWVRegionChart(data) {
    const ctx = document.getElementById('awv-region-chart');
    if (!ctx) return;

    awvRegionChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.regions.map(r => r.name),
            datasets: [{
                label: 'AWV Completion Rate',
                data: data.regions.map(r => r.rate),
                backgroundColor: data.regions.map(r => r.rate >= 50 ? 'rgba(39, 174, 96, 0.7)' : 'rgba(231, 76, 60, 0.7)'),
                borderColor: data.regions.map(r => r.rate >= 50 ? '#27ae60' : '#e74c3c'),
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
                    formatter: (value) => value + '%'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Completion %' }
                }
            }
        }
    });
}

function initAWVEncountersMonthlyChart(data) {
    const ctx = document.getElementById('awv-encounters-monthly-chart');
    if (!ctx) return;

    // Generate 12 months of rolling data
    const months = [];
    const currentDate = new Date();

    for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        months.push(monthName);
    }

    // Region colors and names
    const regions = [
        { name: 'Atlanta North', color: 'rgba(102, 126, 234, 0.8)', borderColor: '#667eea' },
        { name: 'Atlanta South', color: 'rgba(52, 152, 219, 0.8)', borderColor: '#3498db' },
        { name: 'Columbus', color: 'rgba(46, 204, 113, 0.8)', borderColor: '#27ae60' },
        { name: 'Augusta', color: 'rgba(243, 156, 18, 0.8)', borderColor: '#f39c12' },
        { name: 'Macon', color: 'rgba(155, 89, 182, 0.8)', borderColor: '#9b59b6' }
    ];

    // Generate encounter data for each region by month
    const datasets = regions.map((region, regionIndex) => {
        const monthlyData = [];
        for (let i = 0; i < 12; i++) {
            // Base count varies by region size
            const baseCount = [450, 480, 350, 320, 300][regionIndex]; // Proportional to region size
            const variance = Math.sin(i * 0.5) * 80 + Math.random() * 60;
            monthlyData.push(Math.floor(baseCount + variance));
        }
        return {
            label: region.name,
            data: monthlyData,
            backgroundColor: region.color,
            borderColor: region.borderColor,
            borderWidth: 1
        };
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                datalabels: {
                    display: false // Disable individual labels on stacked bars
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: { display: true, text: 'Encounters' },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function initAWVProviderChart(data) {
    const ctx = document.getElementById('awv-provider-chart');
    if (!ctx) return;

    const topProviders = data.providers.slice(0, 10).sort((a, b) => b.rate - a.rate);

    awvProviderChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topProviders.map(p => p.name.replace('Dr. ', '')),
            datasets: [{
                label: 'AWV Rate',
                data: topProviders.map(p => p.rate),
                backgroundColor: topProviders.map(p => p.rate >= 55 ? 'rgba(102, 126, 234, 0.7)' : 'rgba(243, 156, 18, 0.7)'),
                borderColor: topProviders.map(p => p.rate >= 55 ? '#667eea' : '#f39c12'),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#2c3e50',
                    font: { weight: 'bold', size: 10 },
                    anchor: 'end',
                    align: 'right',
                    formatter: (value) => value + '%'
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Completion %' }
                }
            }
        }
    });
}

// ============================================
// HIGH VALUE OUTREACH LIST
// ============================================

function showHighValueOutreach() {
    const patients = awvPatientData.patients
        .filter(p => !p.awvCompleted && p.nextAppt === 'Not scheduled')
        .slice(0, 100);

    const totalPotentialRAF = patients.reduce((sum, p) => sum + p.rafPotential, 0);
    const avgPotentialRAF = (totalPotentialRAF / patients.length).toFixed(2);
    const totalRevOpp = patients.reduce((sum, p) => sum + (p.rafGap * 820), 0); // ~$820 per RAF point

    const modalBody = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
            <div>
                <h2 style="margin: 0;">High-Value Outreach List</h2>
                <p class="provider-summary" style="margin: 0.25rem 0 0 0;">Top 100 Priority Patients for February Outreach</p>
            </div>
            <button onclick="exportHighValueList()" class="btn btn-primary" style="background: #27ae60; border: none; color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>📥</span> Export to CSV
            </button>
        </div>

        <p style="color: #6c757d; font-size: 0.9rem; margin-bottom: 1rem;">
            Patients ranked by Potential RAF who are AWV incomplete and have no scheduled appointments.
            These represent the highest-value outreach opportunities for care coordinators.
        </p>

        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; text-align: center;">
            <strong style="color: #856404; font-size: 0.9rem;">⚠️ SYNTHETIC DATA - NOT REAL PHI</strong>
            <div style="color: #856404; font-size: 0.75rem; margin-top: 0.25rem;">Patient-level data is synthetically generated for demonstration purposes only.</div>
        </div>

        <!-- Summary Stats -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
            <div style="background: linear-gradient(135deg, #667eea15 0%, #667eea25 100%); padding: 1rem; border-radius: 10px; text-align: center; border: 1px solid #667eea;">
                <div style="font-size: 0.8rem; color: #5a67d8;">Total Patients</div>
                <div style="font-size: 1.75rem; font-weight: 700; color: #5a67d8;">${patients.length}</div>
            </div>
            <div style="background: linear-gradient(135deg, #27ae6015 0%, #27ae6025 100%); padding: 1rem; border-radius: 10px; text-align: center; border: 1px solid #27ae60;">
                <div style="font-size: 0.8rem; color: #1e8449;">Avg Potential RAF</div>
                <div style="font-size: 1.75rem; font-weight: 700; color: #1e8449;">${avgPotentialRAF}</div>
            </div>
            <div style="background: linear-gradient(135deg, #f39c1215 0%, #f39c1225 100%); padding: 1rem; border-radius: 10px; text-align: center; border: 1px solid #f39c12;">
                <div style="font-size: 0.8rem; color: #9a7b0a;">Revenue Opportunity</div>
                <div style="font-size: 1.75rem; font-weight: 700; color: #9a7b0a;">$${(totalRevOpp / 1000).toFixed(0)}K</div>
            </div>
            <div style="background: linear-gradient(135deg, #e74c3c15 0%, #e74c3c25 100%); padding: 1rem; border-radius: 10px; text-align: center; border: 1px solid #e74c3c;">
                <div style="font-size: 0.8rem; color: #c0392b;">Status</div>
                <div style="font-size: 1.75rem; font-weight: 700; color: #c0392b;">Not Sched</div>
            </div>
        </div>

        <!-- Patient Table -->
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 1rem; overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Rank</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Patient Name</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">DOB</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">PCP</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; background: #fff3cd;">Potential RAF</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">RAF Gap</th>
                        <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600;">Last Visit</th>
                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Region</th>
                    </tr>
                </thead>
                <tbody>
                    ${patients.slice(0, 50).map((p, i) => `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 0.75rem; font-weight: 600; color: #667eea;">${i + 1}</td>
                            <td style="padding: 0.75rem;"><strong>${p.firstName} ${p.lastName}</strong></td>
                            <td style="padding: 0.75rem; text-align: center; font-family: monospace; color: #6c757d;">${p.dob}</td>
                            <td style="padding: 0.75rem; font-size: 0.8rem;">${p.pcp}</td>
                            <td style="padding: 0.75rem; text-align: center; background: #fffbf0; font-weight: 700; color: #856404;">${p.rafPotential.toFixed(2)}</td>
                            <td style="padding: 0.75rem; text-align: center; color: #C84E28; font-weight: 600;">+${p.rafGap.toFixed(2)}</td>
                            <td style="padding: 0.75rem; text-align: center; font-family: monospace; color: #6c757d;">${p.lastVisit}</td>
                            <td style="padding: 0.75rem; font-size: 0.8rem; color: #495057;">${p.region}</td>
                        </tr>
                    `).join('')}
                    ${patients.length > 50 ? `
                        <tr style="background: #f8f9fa;">
                            <td colspan="8" style="padding: 0.75rem; text-align: center; font-style: italic; color: #6c757d;">
                                Showing first 50 of ${patients.length} patients. Export to CSV for complete list.
                            </td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
    `;

    showModal(modalBody);
}

function exportHighValueList() {
    const patients = awvPatientData.patients
        .filter(p => !p.awvCompleted && p.nextAppt === 'Not scheduled')
        .slice(0, 100);

    const headers = ['Rank', 'Patient Name', 'MRN', 'DOB', 'Age', 'PCP', 'Region', 'RAF Current', 'RAF Potential', 'RAF Gap', 'Last Visit'];
    const rows = patients.map((p, i) => [
        i + 1,
        `${p.firstName} ${p.lastName}`,
        p.mrn,
        p.dob,
        p.age,
        p.pcp,
        p.region,
        p.rafCurrent.toFixed(2),
        p.rafPotential.toFixed(2),
        p.rafGap.toFixed(2),
        p.lastVisit
    ]);

    const csvContent = generateCSVWithDisclaimer(headers, rows);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'High_Value_Outreach_Top100.csv');
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
        <p class="provider-summary">Hospital-level cost variation showing savings opportunity vs benchmark</p>

        <!-- Reference Values Bar -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; border-left: 4px solid #3498db;">
            <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
                <div>
                    <div style="font-size: 0.75rem; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Reference Values</div>
                </div>
                <div style="display: flex; gap: 2.5rem; flex-wrap: wrap;">
                    <div>
                        <span style="font-size: 0.8rem; color: #495057;">Benchmark:</span>
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
                    Benchmark
                </div>
                <div class="kpi-value" style="font-size: 2rem; font-weight: 700; color: #155724; margin: 0.5rem 0;">
                    $${totalOpportunity.toLocaleString()}
                </div>
                <div style="font-size: 0.8rem; color: #155724; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(40,167,69,0.3);">
                    <span>Benchmark:</span>
                    <span style="font-weight: 600; margin-left: 0.5rem;">$${benchmarkCost.toLocaleString()} (Regional)</span>
                    <div style="font-size: 0.7rem; color: #1e7e34; margin-top: 0.25rem;">
                        ${providersAboveBenchmark} hospitals above benchmark
                    </div>
                </div>
            </div>
        </div>

        <!-- Savings Calculation Breakdown -->
        <div style="background: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid #e0e0e0;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1rem; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem;">
                <svg style="width:20px;height:20px;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8"/><rect x="14" y="6" width="3" height="12"/></svg> Savings Calculation Breakdown
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
            benchmark: 78.0,
            stars: 4,
            gaps: ['2,847 women due for screening in next 90 days', '1,459 women overdue for screening']
        },
        'COA': {
            name: 'Care for Older Adults - Medication Review',
            description: 'The percentage of adults 66+ who had a medication review during the measurement year.',
            denominator: 12456,
            numerator: 9587,
            compliance: 76.9,
            benchmark: 75.0,
            stars: 4,
            gaps: ['AWV scheduled for 2,341 patients - review medications during visit', '528 patients with polypharmacy at high risk']
        },
        'COL': {
            name: 'Colorectal Cancer Screening',
            description: 'The percentage of adults 45-75 years of age who had appropriate screening for colorectal cancer.',
            denominator: 15823,
            numerator: 12152,
            compliance: 76.8,
            benchmark: 72.0,
            stars: 4,
            gaps: ['3,671 patients due for FIT/colonoscopy', '1,234 patients with scheduled appointments - order screening']
        },
        'CBP': {
            name: 'Controlling High Blood Pressure',
            description: 'The percentage of patients 18-85 years of age with hypertension whose BP was adequately controlled (<140/90).',
            denominator: 9847,
            numerator: 7129,
            compliance: 72.4,
            benchmark: 70.0,
            stars: 4,
            gaps: ['2,718 patients with uncontrolled BP', '892 patients need medication adjustment', '456 patients lost to follow-up']
        },
        'HBD': {
            name: 'Diabetes: Hemoglobin A1c (HbA1c) Poor Control (>9%)',
            description: 'The percentage of patients 18-75 with diabetes whose HbA1c was >9.0% during the measurement year. Lower is better.',
            denominator: 6234,
            numerator: 1135,  // patients with poor control (inverted)
            compliance: 18.2,  // % with poor control (inverted - lower is better)
            benchmark: 15.0,
            stars: 2,
            gaps: ['1,135 patients with HbA1c >9%', '234 patients without HbA1c in past 12 months'],
            isInverted: true,
            thresholds: {
                'gt9': { numerator: 1135, compliance: 18.2, description: '>9.0%' },
                'gt8': { numerator: 1867, compliance: 29.95, description: '>8.0%' }
            }
        },
        'EED': {
            name: 'Eye Exam for Patients with Diabetes',
            description: 'The percentage of patients 18-75 with diabetes who had a retinal eye exam during the measurement year.',
            denominator: 6234,
            numerator: 4295,
            compliance: 68.9,
            benchmark: 65.0,
            stars: 3,
            gaps: ['1,939 patients overdue for eye exam', 'Partner with ophthalmology for in-office retinal imaging']
        },
        'FMC': {
            name: 'Follow-up After ED Visit (Multiple Chronic Conditions)',
            description: 'The percentage of ED visits for patients with multiple chronic conditions who had a follow-up visit within 7 days.',
            denominator: 2847,
            numerator: 1823,
            compliance: 64.0,
            benchmark: 60.0,
            stars: 3,
            gaps: ['1,024 patients did not receive timely follow-up', 'Implement post-ED discharge outreach program']
        },
        'SPC': {
            name: 'Medication Adherence - Cholesterol (Statin)',
            description: 'The percentage of patients with a statin prescription who achieved PDC ≥80% during the measurement year.',
            denominator: 7892,
            numerator: 6945,
            compliance: 88.0,
            benchmark: 85.0,
            stars: 5,
            gaps: ['947 patients with adherence gaps', '312 patients flagged for pharmacy outreach']
        },
        'SPD': {
            name: 'Medication Adherence - Diabetes Medications',
            description: 'The percentage of patients with diabetes medication prescription who achieved PDC ≥80%.',
            denominator: 5123,
            numerator: 4406,
            compliance: 86.0,
            benchmark: 82.0,
            stars: 5,
            gaps: ['717 patients with adherence gaps', 'Consider 90-day fills and mail order']
        },
        'SPH': {
            name: 'Medication Adherence - Hypertension (RASA)',
            description: 'The percentage of patients with RASA prescription who achieved PDC ≥80% during the measurement year.',
            denominator: 8456,
            numerator: 7272,
            compliance: 86.0,
            benchmark: 83.0,
            stars: 5,
            gaps: ['1,184 patients with adherence gaps', 'Simplify regimens where possible']
        },
        'OMW': {
            name: 'Osteoporosis Management in Women Who Had a Fracture',
            description: 'The percentage of women 67-85 who suffered a fracture and received osteoporosis therapy within 6 months.',
            denominator: 892,
            numerator: 445,
            compliance: 49.9,
            benchmark: 52.0,
            stars: 2,
            gaps: ['447 women did not receive appropriate therapy', 'Review fracture liaison service protocols']
        },
        'PCR': {
            name: 'Plan All-Cause Readmissions',
            description: 'The risk-adjusted ratio of observed to expected 30-day readmissions (lower is better, shown as % avoided).',
            denominator: 4567,
            numerator: 4170,
            compliance: 91.3,
            benchmark: 88.0,
            stars: 4,
            gaps: ['397 potentially preventable readmissions', 'Focus on CHF and COPD transitions']
        },
        'STC': {
            name: 'Statin Therapy - Cardiovascular Disease',
            description: 'The percentage of patients with CVD who received statin therapy during the measurement year.',
            denominator: 5234,
            numerator: 3884,
            compliance: 74.2,
            benchmark: 72.0,
            stars: 3,
            gaps: ['1,350 patients without statin therapy', '423 patients with documented contraindication/intolerance']
        },
        'SUPD': {
            name: 'Statin Use in Persons with Diabetes',
            description: 'The percentage of patients 40-75 with diabetes who received statin therapy.',
            denominator: 6234,
            numerator: 5236,
            compliance: 84.0,
            benchmark: 80.0,
            stars: 4,
            gaps: ['998 diabetic patients without statin', 'Review for guideline-directed therapy']
        },
        'TRC': {
            name: 'Transitions of Care',
            description: 'The percentage of discharges with a timely notification, receipt of discharge info, and engagement.',
            denominator: 3456,
            numerator: 2419,
            compliance: 70.0,
            benchmark: 68.0,
            stars: 3,
            gaps: ['1,037 transitions without complete documentation', 'Enhance discharge summary workflows']
        }
    };

    const data = hedisData[measureCode];
    if (!data) return;

    // For inverted measures (like HBD), numerator represents non-compliant patients
    const isInverted = data.isInverted || false;

    // Calculate derived metrics to match ACO layout
    let gapCount, compliantPatients;
    if (isInverted) {
        // For inverted measures: numerator = patients with poor outcome (non-compliant)
        gapCount = data.numerator;
        compliantPatients = data.denominator - data.numerator;
    } else {
        // For normal measures: numerator = compliant patients
        compliantPatients = data.numerator;
        gapCount = data.denominator - data.numerator;
    }

    const gapPercent = ((gapCount / data.denominator) * 100).toFixed(1);
    const scheduledPatients = Math.floor(gapCount * 0.4);
    const forecastedCompliance = (data.compliance + (scheduledPatients / data.denominator * 100)).toFixed(1);
    const trend = data.compliance > data.benchmark
        ? `↑ ${(data.compliance - data.benchmark).toFixed(1)} pts above benchmark`
        : `↓ ${(data.benchmark - data.compliance).toFixed(1)} pts below benchmark`;

    // Generate data for charts
    const monthlyData = generateMonthlyData(data.compliance);
    const regionalData = generateRegionalData(data.compliance);
    const providers = generateHedisProviderRankings(data.denominator, data.compliance, isInverted);

    let modalContent = '<div class="measure-dashboard">';

    // Header - matching ACO style with toggle for HBD
    modalContent += `
        <div class="measure-header">
            <div class="measure-title" id="measure-title-${measureCode}">${data.name}</div>
            <div class="measure-code">${measureCode}</div>
        </div>
    `;

    // Add threshold toggle for HBD
    if (measureCode === 'HBD' && data.thresholds) {
        modalContent += `
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="font-weight: 600; color: #2c3e50;">HbA1c Threshold:</span>
                    <div class="scenario-toggle-container">
                        <button class="scenario-toggle-btn active" onclick="toggleHbA1cThreshold('HBD', 'gt9', event)">
                            >9.0%
                        </button>
                        <button class="scenario-toggle-btn" onclick="toggleHbA1cThreshold('HBD', 'gt8', event)">
                            >8.0%
                        </button>
                    </div>
                </div>
                <div style="margin-top: 0.75rem; font-size: 0.85rem; color: #7f8c8d;">
                    Toggle between poor control thresholds. Lower percentage is better for this inverted measure.
                </div>
            </div>
        `;
    }

    // Dynamic measures that should not show forecasted compliance
    const dynamicMeasures = ['HBD', 'CBP', 'SPC', 'SPD', 'SPH', 'PCR', 'TRC'];
    const isDynamic = dynamicMeasures.includes(measureCode);

    // Summary Cards - matching ACO layout exactly
    modalContent += '<div class="measure-summary-grid" id="hbd-summary-cards">';
    modalContent += `
        <div class="measure-summary-card">
            <div class="summary-card-label">Current Performance</div>
            <div class="summary-card-value" id="hbd-performance">${data.compliance}%</div>
            <div class="summary-card-detail">${trend}</div>
        </div>
        <div class="measure-summary-card">
            <div class="summary-card-label">Total Patients</div>
            <div class="summary-card-value">${data.denominator.toLocaleString()}</div>
            <div class="summary-card-detail" id="hbd-compliant">${compliantPatients.toLocaleString()} compliant</div>
        </div>
        <div class="measure-summary-card">
            <div class="summary-card-label">Gap Opportunity</div>
            <div class="summary-card-value" id="hbd-gap">${gapCount.toLocaleString()}</div>
            <div class="summary-card-detail" id="hbd-gap-percent">${gapPercent}% of denominator</div>
        </div>
    `;

    // For HBD measure, add breakdown cards
    if (measureCode === 'HBD') {
        // HbA1c >9 and 12 Month Lapse should sum to Gap Opportunity
        const hba1cAbove9 = Math.floor(gapCount * 0.55); // 55% have HbA1c >9
        const twelveMonthLapse = gapCount - hba1cAbove9; // Remaining patients are lapsed (ensures sum = gapCount)
        // Prospective lapse is separate - patients who will become non-compliant next month
        const prospectiveLapse = Math.floor(data.denominator * 0.08); // ~8% will lapse soon
        modalContent += `
        <div class="measure-summary-card breakdown-container">
            <div class="breakdown-stack">
                <div class="breakdown-card">
                    <div class="breakdown-label">HbA1c >9</div>
                    <div class="breakdown-value">${hba1cAbove9}</div>
                </div>
                <div class="breakdown-card">
                    <div class="breakdown-label">12 Month Lapse</div>
                    <div class="breakdown-value">${twelveMonthLapse}</div>
                </div>
                <div class="breakdown-card">
                    <div class="breakdown-label">Prospective Lapse</div>
                    <div class="breakdown-value">${prospectiveLapse}</div>
                </div>
            </div>
        </div>
        `;
    } else if (!isDynamic) {
        // Only show forecasted compliance for non-dynamic, non-HBD measures
        modalContent += `
        <div class="measure-summary-card">
            <div class="summary-card-label">Forecasted Compliance</div>
            <div class="summary-card-value">${forecastedCompliance}%</div>
            <div class="summary-card-detail">${scheduledPatients} scheduled visits</div>
        </div>
        `;
    }

    modalContent += '</div>';

    // Charts Section - matching ACO layout
    modalContent += '<div class="measure-charts-grid">';

    // Monthly Performance Chart
    modalContent += `
        <div class="measure-chart-card" onclick="showHedisPatientListByMonth('${measureCode}', '${data.name}')">
            <div class="chart-card-title"><svg style="width:14px;height:14px;vertical-align:-2px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 5 6-9"/></svg>Monthly Performance Trend</div>
            <canvas id="hedisMonthlyTrendChart-${measureCode}" style="max-height: 300px;"></canvas>
            <div style="text-align: center; margin-top: 0.5rem; font-size: 0.85rem; color: var(--piedmont-gray);">
                Click to view patients by month
            </div>
        </div>
    `;

    // Regional Compliance Chart
    modalContent += `
        <div class="measure-chart-card" onclick="showHedisPatientListByRegion('${measureCode}', '${data.name}')">
            <div class="chart-card-title">🗺️ % Compliance by Region</div>
            <canvas id="hedisRegionalChart-${measureCode}" style="max-height: 300px;"></canvas>
            <div style="text-align: center; margin-top: 0.5rem; font-size: 0.85rem; color: var(--piedmont-gray);">
                Click to view patients by region
            </div>
        </div>
    `;

    modalContent += '</div>';

    // Provider Rankings - same structure as ACO
    modalContent += `
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

    providers.forEach((provider, index) => {
        const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
        const oppClass = provider.gapCount > 20 ? 'high' : provider.gapCount > 10 ? 'medium' : 'low';
        const oppLabel = provider.gapCount > 20 ? 'High' : provider.gapCount > 10 ? 'Medium' : 'Low';

        modalContent += `
            <tr onclick="showHedisPatientList('${measureCode}', '${data.name}', '${provider.name}')" style="cursor: pointer;">
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

    modalContent += `
                </tbody>
            </table>
        </div>
    `;

    // Top opportunity PCP - same as ACO
    const topOppPCP = providers[providers.length - 1];
    modalContent += `
        <div class="alert-box warning">
            <h4>🎯 Top Opportunity: ${topOppPCP.name}</h4>
            <p><strong>${topOppPCP.gapCount} patients</strong> with open gaps (${topOppPCP.complianceRate}% compliance rate)</p>
            <p>If ${topOppPCP.name} closes all gaps, performance would increase by <strong>${(topOppPCP.gapCount / data.denominator * 100).toFixed(1)}%</strong></p>
            <button class="btn-small" onclick="showHedisPatientList('${measureCode}', '${data.name}', '${topOppPCP.name}')" style="margin-top: 1rem;">
                View ${topOppPCP.name}'s Patient List →
            </button>
        </div>
    `;

    modalContent += '</div>';

    showModal(modalContent);

    // Render charts after modal is shown
    setTimeout(() => {
        renderHedisMonthlyTrendChart(measureCode, monthlyData);
        renderHedisRegionalChart(measureCode, regionalData);
    }, 100);
}

// Render monthly trend chart for HEDIS measures
function renderHedisMonthlyTrendChart(measureCode, monthlyData) {
    const ctx = document.getElementById('hedisMonthlyTrendChart-' + measureCode);
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.map(d => d.month),
            datasets: [{
                label: 'Performance %',
                data: monthlyData.map(d => d.performance),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
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
                    color: '#3498db',
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

// Render regional chart for HEDIS measures
function renderHedisRegionalChart(measureCode, regionalData) {
    const ctx = document.getElementById('hedisRegionalChart-' + measureCode);
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: regionalData.map(d => d.region),
            datasets: [{
                label: 'Compliance %',
                data: regionalData.map(d => d.performance),
                backgroundColor: regionalData.map(d => d.performance >= 75 ? '#27ae60' : d.performance >= 65 ? '#f39c12' : '#e74c3c'),
                borderRadius: 4
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
                    font: { weight: 'bold', size: 11 },
                    anchor: 'end',
                    align: 'start',
                    offset: 8,
                    formatter: function(value) {
                        return value.toFixed(1) + '%';
                    }
                },
                tooltip: { enabled: true }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: function(value) { return value + '%'; } }
                }
            }
        }
    });
}

// Placeholder functions for HEDIS patient lists by month/region
function showHedisPatientListByMonth(measureCode, measureName) {
    showHedisPatientList(measureCode, measureName, 'All Providers');
}

function showHedisPatientListByRegion(measureCode, measureName) {
    showHedisPatientList(measureCode, measureName, 'All Providers');
}

window.showHedisPatientListByMonth = showHedisPatientListByMonth;
window.showHedisPatientListByRegion = showHedisPatientListByRegion;

// Toggle HbA1c threshold between >9% and >8%
function toggleHbA1cThreshold(measureCode, threshold, event) {
    const data = hedisData[measureCode];
    if (!data || !data.thresholds) return;

    const thresholdData = data.thresholds[threshold];
    if (!thresholdData) return;

    // Calculate updated values for inverted measure
    const compliantPatients = data.denominator - thresholdData.numerator;
    const gapPercent = ((thresholdData.numerator / data.denominator) * 100).toFixed(1);

    // Update summary card values
    const performanceEl = document.getElementById('hbd-performance');
    const gapEl = document.getElementById('hbd-gap');
    const gapPercentEl = document.getElementById('hbd-gap-percent');
    const compliantEl = document.getElementById('hbd-compliant');

    if (performanceEl) performanceEl.textContent = thresholdData.compliance + '%';
    if (gapEl) gapEl.textContent = thresholdData.numerator.toLocaleString();
    if (gapPercentEl) gapPercentEl.textContent = gapPercent + '% of denominator';
    if (compliantEl) compliantEl.textContent = compliantPatients.toLocaleString() + ' compliant';

    // Update button active states
    document.querySelectorAll('.scenario-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Update the data object for chart regeneration
    data.numerator = thresholdData.numerator;
    data.compliance = thresholdData.compliance;

    // Regenerate monthly and regional data
    const monthlyData = generateHedisMonthlyData(data.compliance);
    const regionalData = generateHedisRegionalData(data.compliance);

    // Destroy existing charts
    const monthlyChartCanvas = document.getElementById('hedisMonthlyTrendChart-' + measureCode);
    const regionalChartCanvas = document.getElementById('hedisRegionalChart-' + measureCode);

    if (monthlyChartCanvas) {
        const existingMonthlyChart = Chart.getChart(monthlyChartCanvas);
        if (existingMonthlyChart) existingMonthlyChart.destroy();
    }

    if (regionalChartCanvas) {
        const existingRegionalChart = Chart.getChart(regionalChartCanvas);
        if (existingRegionalChart) existingRegionalChart.destroy();
    }

    // Re-render charts with new data
    renderHedisMonthlyTrendChart(measureCode, monthlyData);
    renderHedisRegionalChart(measureCode, regionalData);

    // Update provider rankings table
    const providers = generateHedisProviderRankings(data.denominator, data.compliance, true);
    const rankingTable = document.querySelector('.ranking-table tbody');
    if (rankingTable) {
        let rankingHTML = '';
        providers.forEach((provider, index) => {
            const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            const oppClass = provider.gapCount > 20 ? 'high' : provider.gapCount > 10 ? 'medium' : 'low';
            const oppLabel = provider.gapCount > 20 ? 'High' : provider.gapCount > 10 ? 'Medium' : 'Low';

            rankingHTML += `
                <tr onclick="showHedisPatientList('${measureCode}', '${data.name}', '${provider.name}')" style="cursor: pointer;">
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
        rankingTable.innerHTML = rankingHTML;
    }
}

window.toggleHbA1cThreshold = toggleHbA1cThreshold;

// Generate provider rankings for HEDIS measures
function generateHedisProviderRankings(totalDenominator, avgCompliance, isInverted = false) {
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
        const complianceRate = Math.max(50, Math.min(100, avgCompliance + complianceVariance));

        let compliantPatients, gapCount;
        if (isInverted) {
            // For inverted measures: complianceRate = % with poor outcome (non-compliant)
            gapCount = Math.floor(providerPatients * (complianceRate / 100));
            compliantPatients = providerPatients - gapCount;
        } else {
            // For normal measures: complianceRate = % compliant
            compliantPatients = Math.floor(providerPatients * (complianceRate / 100));
            gapCount = providerPatients - compliantPatients;
        }

        return {
            name: name,
            totalPatients: providerPatients,
            compliantPatients: compliantPatients,
            complianceRate: complianceRate.toFixed(1),
            gapCount: gapCount
        };
    }).sort((a, b) => {
        // For inverted measures: lower rate is better (ascending)
        // For normal measures: higher rate is better (descending)
        return isInverted
            ? parseFloat(a.complianceRate) - parseFloat(b.complianceRate)
            : parseFloat(b.complianceRate) - parseFloat(a.complianceRate);
    });
}

// Show HEDIS patient list with export capability
function showHedisPatientList(measureCode, measureName, providerName) {
    const patients = generateHedisPatientListData(measureCode, measureName, providerName);

    let modalBody = '<div class="patient-list-container">';

    // Header with export button
    modalBody += `
        <div class="list-controls">
            <div>
                <div class="list-title">${measureName} - Patient List</div>
                <div style="font-size: 0.9rem; color: var(--piedmont-gray); margin-top: 0.5rem;">
                    Provider: ${providerName} | Total: ${patients.length} patients | Non-Compliant: ${patients.filter(p => !p.compliant).length}
                </div>
            </div>
            <button class="export-btn" onclick="exportHedisPatientList('${measureCode}', '${measureName}', '${providerName}')">
                📥 Export to Excel
            </button>
        </div>
    `;

    // Check if TRC measure to show discharge date column
    const isTRC = measureCode === 'TRC';

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
                        ${isTRC ? '<th>Discharge Date</th>' : ''}
                        <th>Compliant</th>
                        <th>Gap Status</th>
                        <th>Last Service Date</th>
                        <th>Due Date</th>
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
                ${isTRC ? `<td>${patient.dischargeDate || '<span style="color: #ccc;">—</span>'}</td>` : ''}
                <td><span class="compliant-badge ${patient.compliant ? 'yes' : 'no'}">${patient.compliant ? 'Yes' : 'No'}</span></td>
                <td>
                    <span class="gap-indicator ${patient.gapStatus}">${patient.gapStatus === 'open' ? '✗ Open' : '✓ Closed'}</span>
                </td>
                <td>${patient.lastServiceDate || '<span style="color: #ccc;">—</span>'}</td>
                <td>${patient.dueDate || '<span style="color: #ccc;">—</span>'}</td>
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

// Generate HEDIS patient list data
function generateHedisPatientListData(measureCode, measureName, providerName) {
    const patientCount = Math.floor(Math.random() * 40) + 60;
    const patients = [];

    const firstNames = ['John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    const caseManagers = ['Jennifer Rodriguez, RN', 'Michael Chen, RN', 'Sarah Thompson, RN', null, null];

    const isTRC = measureCode === 'TRC';
    const today = new Date('2026-01-29');

    for (let i = 0; i < patientCount; i++) {
        const isCompliant = Math.random() > 0.3;
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const birthYear = 1940 + Math.floor(Math.random() * 50);
        const birthMonth = Math.floor(Math.random() * 12) + 1;
        const birthDay = Math.floor(Math.random() * 28) + 1;

        const hasAppt = Math.random() > 0.4;
        const apptMonth = Math.floor(Math.random() * 6) + 1;
        const apptDay = Math.floor(Math.random() * 28) + 1;
        const apptHour = Math.floor(Math.random() * 8) + 8;

        // For TRC measure, generate discharge dates and determine gap status based on 30-day window
        let dischargeDate = null;
        let gapStatus = isCompliant ? 'closed' : 'open';

        if (isTRC) {
            // Generate random discharge date between 1-60 days ago
            const daysAgo = Math.floor(Math.random() * 60) + 1;
            const discharge = new Date(today);
            discharge.setDate(discharge.getDate() - daysAgo);
            dischargeDate = `${discharge.getMonth() + 1}/${discharge.getDate()}/2026`;

            // Gap is only open if within 30 days of discharge
            if (!isCompliant) {
                gapStatus = daysAgo <= 30 ? 'open' : 'closed';
            }
        }

        patients.push({
            name: `${lastName}, ${firstName}`,
            mrn: 'MRN' + String(Math.floor(Math.random() * 900000) + 100000),
            dob: `${birthMonth}/${birthDay}/${birthYear}`,
            pcp: providerName,
            compliant: isCompliant,
            gapStatus: gapStatus,
            lastServiceDate: isCompliant ? `${Math.floor(Math.random() * 12) + 1}/15/2026` : null,
            dueDate: !isCompliant ? `${Math.floor(Math.random() * 6) + 1}/1/2026` : null,
            caseManager: caseManagers[Math.floor(Math.random() * caseManagers.length)],
            dischargeDate: dischargeDate,
            nextAppt: hasAppt ? {
                date: `${apptMonth}/${apptDay}/2026`,
                time: `${apptHour}:00 AM`
            } : null
        });
    }

    return patients.sort((a, b) => a.compliant - b.compliant);
}

// Export HEDIS patient list to CSV
function exportHedisPatientList(measureCode, measureName, providerName) {
    const patients = generateHedisPatientListData(measureCode, measureName, providerName);
    const isTRC = measureCode === 'TRC';

    let csvContent = isTRC
        ? 'Patient Name,MRN,DOB,PCP,Discharge Date,Compliant,Gap Status,Last Service Date,Due Date,Case Manager,Next Appt\n'
        : 'Patient Name,MRN,DOB,PCP,Compliant,Gap Status,Last Service Date,Due Date,Case Manager,Next Appt\n';

    patients.forEach(patient => {
        const nextApptStr = patient.nextAppt ? `${patient.nextAppt.date} ${patient.nextAppt.time}` : '';
        if (isTRC) {
            csvContent += `"${patient.name}","${patient.mrn}","${patient.dob}","${patient.pcp}","${patient.dischargeDate || ''}","${patient.compliant ? 'Yes' : 'No'}","${patient.gapStatus}","${patient.lastServiceDate || ''}","${patient.dueDate || ''}","${patient.caseManager || ''}","${nextApptStr}"\n`;
        } else {
            csvContent += `"${patient.name}","${patient.mrn}","${patient.dob}","${patient.pcp}","${patient.compliant ? 'Yes' : 'No'}","${patient.gapStatus}","${patient.lastServiceDate || ''}","${patient.dueDate || ''}","${patient.caseManager || ''}","${nextApptStr}"\n`;
        }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `HEDIS_${measureCode}_${providerName.replace(/\s+/g, '_')}_patients.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.showHedisPatientList = showHedisPatientList;
window.exportHedisPatientList = exportHedisPatientList;

// Export Full Patient Roster for HEDIS Reconciliation
function exportFullPatientRoster() {
    // Show loading indicator
    const loadingModal = document.createElement('div');
    loadingModal.id = 'export-loading-modal';
    loadingModal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 2rem; border-radius: 12px; text-align: center; max-width: 400px;">
                <div style="margin-bottom: 1rem;"><svg style="width:32px;height:32px;" viewBox="0 0 24 24" fill="none" stroke="#7f8c8d" stroke-width="2"><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8"/><rect x="14" y="6" width="3" height="12"/></svg></div>
                <h3 style="margin: 0 0 0.5rem 0; color: #2c3e50;">Generating Patient Roster</h3>
                <p style="color: #7f8c8d; margin: 0 0 1rem 0;">Compiling 47,832 patient records with all HEDIS care gap statuses...</p>
                <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                    <div style="width: 0%; height: 100%; background: linear-gradient(90deg, #3498db, #27ae60); animation: progressBar 2s ease-out forwards;"></div>
                </div>
            </div>
        </div>
        <style>
            @keyframes progressBar {
                0% { width: 0%; }
                100% { width: 100%; }
            }
        </style>
    `;
    document.body.appendChild(loadingModal);

    // Generate data asynchronously
    setTimeout(() => {
        const patients = generateFullPatientRoster();

        // HEDIS measure codes for columns
        const hedisMeasures = [
            { code: 'BCS', name: 'Breast Cancer Screening' },
            { code: 'COA', name: 'Care for Older Adults - Med Review' },
            { code: 'COL', name: 'Colorectal Cancer Screening' },
            { code: 'CBP', name: 'Controlling High Blood Pressure' },
            { code: 'HBD', name: 'Diabetes - Blood Sugar Controlled' },
            { code: 'EED', name: 'Eye Exam for Diabetes' },
            { code: 'FMC', name: 'Follow-up After ED Visit' },
            { code: 'SPC', name: 'Med Adherence - Cholesterol' },
            { code: 'SPD', name: 'Med Adherence - Diabetes' },
            { code: 'SPH', name: 'Med Adherence - Hypertension' },
            { code: 'OMW', name: 'Osteoporosis Management' },
            { code: 'PCR', name: 'Plan All-Cause Readmissions' },
            { code: 'STC', name: 'Statin Therapy - CVD' },
            { code: 'SUPD', name: 'Statin Use in Diabetes' },
            { code: 'TRC', name: 'Transitions of Care' }
        ];

        // Build CSV header
        let csvContent = 'Subscriber ID,MRN,Last Name,First Name,DOB,Gender,Address,City,State,ZIP,Phone,Email,PCP,Care Manager,Current RAF,RAF Gap,Potential RAF,AWV Status,AWV Date,Last Visit Date,Next Appt Date,';
        csvContent += hedisMeasures.map(m => `${m.code} Status`).join(',');
        csvContent += '\n';

        // Build CSV rows
        patients.forEach(patient => {
            const row = [
                patient.subscriberId,
                patient.mrn,
                `"${patient.lastName}"`,
                `"${patient.firstName}"`,
                patient.dob,
                patient.gender,
                `"${patient.address}"`,
                `"${patient.city}"`,
                patient.state,
                patient.zip,
                patient.phone,
                patient.email,
                `"${patient.pcp}"`,
                `"${patient.careManager || ''}"`,
                patient.rafScore,
                patient.rafGap,
                patient.potentialRaf,
                patient.awvStatus,
                patient.awvDate || '',
                patient.lastVisitDate || '',
                patient.nextApptDate || ''
            ];

            // Add care gap status for each measure
            hedisMeasures.forEach(measure => {
                row.push(patient.careGaps[measure.code] || 'N/A');
            });

            csvContent += row.join(',') + '\n';
        });

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const today = new Date().toISOString().split('T')[0];
        link.setAttribute('href', url);
        link.setAttribute('download', `HEDIS_Full_Patient_Roster_${today}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Remove loading modal
        document.body.removeChild(loadingModal);

        // Show success message
        showModal(`
            <div style="text-align: center; padding: 1rem;">
                <div style="margin-bottom: 1rem;"><svg style="width:48px;height:48px;" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg></div>
                <h2 style="margin: 0 0 1rem 0; color: #27ae60;">Export Complete</h2>
                <p style="color: #5a6c7d; margin-bottom: 1.5rem;">
                    Successfully exported <strong>47,832 patient records</strong> with care gap statuses for all 15 HEDIS measures.
                </p>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: left; margin-bottom: 1rem;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem; color: #2c3e50;">📄 File Details:</div>
                    <ul style="margin: 0; padding-left: 1.25rem; color: #5a6c7d; line-height: 1.8;">
                        <li>File: HEDIS_Full_Patient_Roster_${today}.csv</li>
                        <li>Patient demographics (Name, DOB, Address, Phone, etc.)</li>
                        <li>Subscriber ID, MRN, and RAF Score for payer reconciliation</li>
                        <li>15 HEDIS measure columns (Open/Closed/Excluded or blank if not eligible)</li>
                    </ul>
                </div>
                <p style="font-size: 0.85rem; color: #7f8c8d;">
                    Use this file to reconcile against monthly payer care gap closure reports.
                </p>
            </div>
        `);
    }, 2000);
}

// Generate full patient roster with demographics and all care gaps
function generateFullPatientRoster() {
    const patients = [];
    const patientCount = 47832;

    const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Barbara',
                        'William', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
                        'Christopher', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
                        'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                       'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                       'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];
    const streets = ['Oak St', 'Maple Ave', 'Main St', 'Park Rd', 'Cedar Ln', 'Elm St', 'Pine Dr', 'Lake View Rd', 'Highland Ave', 'Forest Dr'];
    const cities = ['Atlanta', 'Marietta', 'Alpharetta', 'Roswell', 'Sandy Springs', 'Dunwoody', 'Decatur', 'Lawrenceville', 'Smyrna', 'Kennesaw'];
    const pcps = ['Dr. Chen', 'Dr. Santos', 'Dr. Williams', 'Dr. Anderson', 'Dr. Brown', 'Dr. Davis', 'Dr. Miller', 'Dr. Wilson', 'Dr. Garcia', 'Dr. Martinez'];
    const careManagers = ['Jennifer Rodriguez, RN', 'Michael Chen, RN', 'Sarah Thompson, RN', 'David Kim, RN', 'Lisa Patel, RN', null, null, null];

    // HEDIS measures with eligibility criteria (simplified)
    const measureEligibility = {
        'BCS': { minAge: 50, maxAge: 74, genderReq: 'F' },           // Women 50-74
        'COA': { minAge: 66, maxAge: 120 },                          // Adults 66+
        'COL': { minAge: 45, maxAge: 75 },                           // Adults 45-75
        'CBP': { minAge: 18, maxAge: 85, chronicCondition: 'HTN' },  // HTN patients 18-85
        'HBD': { minAge: 18, maxAge: 75, chronicCondition: 'DM' },   // Diabetics 18-75
        'EED': { minAge: 18, maxAge: 75, chronicCondition: 'DM' },   // Diabetics 18-75
        'FMC': { minAge: 18, maxAge: 120, chronicCondition: 'MCC' }, // Multiple chronic conditions
        'SPC': { minAge: 21, maxAge: 120, medication: 'statin' },    // Statin users
        'SPD': { minAge: 18, maxAge: 120, medication: 'DM_med' },    // DM medication users
        'SPH': { minAge: 18, maxAge: 120, medication: 'HTN_med' },   // HTN medication users
        'OMW': { minAge: 67, maxAge: 85, genderReq: 'F' },           // Women 67-85 with fracture
        'PCR': { minAge: 18, maxAge: 120 },                          // All adults with admission
        'STC': { minAge: 21, maxAge: 120, chronicCondition: 'CVD' }, // CVD patients
        'SUPD': { minAge: 40, maxAge: 75, chronicCondition: 'DM' },  // Diabetics 40-75
        'TRC': { minAge: 18, maxAge: 120 }                           // All adults with discharge
    };

    for (let i = 0; i < patientCount; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const gender = Math.random() > 0.52 ? 'F' : 'M';
        const birthYear = 1940 + Math.floor(Math.random() * 60);
        const birthMonth = Math.floor(Math.random() * 12) + 1;
        const birthDay = Math.floor(Math.random() * 28) + 1;
        const age = 2026 - birthYear;

        // Randomly assign chronic conditions
        const hasDM = Math.random() > 0.85;      // ~15% diabetic
        const hasHTN = Math.random() > 0.70;     // ~30% hypertension
        const hasCVD = Math.random() > 0.90;     // ~10% CVD
        const hasMCC = (hasDM && hasHTN) || (hasDM && hasCVD) || (hasHTN && hasCVD);
        const onStatin = hasCVD || hasDM || Math.random() > 0.80;
        const onDMMed = hasDM;
        const onHTNMed = hasHTN;
        const hadFracture = gender === 'F' && age >= 67 && Math.random() > 0.95;
        const hadAdmission = Math.random() > 0.90;
        const hadDischarge = hadAdmission;

        // Generate care gaps for each measure
        const careGaps = {};
        Object.entries(measureEligibility).forEach(([code, criteria]) => {
            // Check eligibility (patient in denominator)
            let eligible = age >= criteria.minAge && age <= criteria.maxAge;
            if (criteria.genderReq && gender !== criteria.genderReq) eligible = false;
            if (criteria.chronicCondition === 'DM' && !hasDM) eligible = false;
            if (criteria.chronicCondition === 'HTN' && !hasHTN) eligible = false;
            if (criteria.chronicCondition === 'CVD' && !hasCVD) eligible = false;
            if (criteria.chronicCondition === 'MCC' && !hasMCC) eligible = false;
            if (criteria.medication === 'statin' && !onStatin) eligible = false;
            if (criteria.medication === 'DM_med' && !onDMMed) eligible = false;
            if (criteria.medication === 'HTN_med' && !onHTNMed) eligible = false;
            if (code === 'OMW' && !hadFracture) eligible = false;
            if (code === 'PCR' && !hadAdmission) eligible = false;
            if (code === 'TRC' && !hadDischarge) eligible = false;

            if (!eligible) {
                // Not eligible = blank (patient not in denominator for this measure)
                careGaps[code] = '';
            } else {
                // Eligible - check for exclusion criteria first
                // Exclusion criteria: hospice, contraindication, advanced illness, frailty, etc.
                // ~3-8% of eligible patients may have valid exclusion criteria depending on measure
                const exclusionRate = code === 'BCS' || code === 'COL' ? 0.05 : // Cancer screenings - mastectomy, colectomy
                                     code === 'CBP' || code === 'HBD' ? 0.03 : // Chronic disease - ESRD, hospice
                                     code === 'OMW' ? 0.08 : // Osteoporosis - already on therapy
                                     code === 'FMC' || code === 'TRC' ? 0.02 : // Transitions - died, left AMA
                                     0.04; // Default exclusion rate

                if (Math.random() < exclusionRate) {
                    // Patient meets documented exclusion criteria
                    careGaps[code] = 'Excluded';
                } else {
                    // In denominator - determine if gap is open or closed
                    const closedRate = 0.70 + Math.random() * 0.15; // 70-85% closure rate
                    careGaps[code] = Math.random() < closedRate ? 'Closed' : 'Open';
                }
            }
        });

        // Generate RAF score (risk adjustment factor)
        // Base RAF around 1.0, higher for older patients and those with chronic conditions
        let rafScore = 0.9 + Math.random() * 0.3; // Base 0.9-1.2
        if (age >= 75) rafScore += 0.3 + Math.random() * 0.4;
        else if (age >= 65) rafScore += 0.1 + Math.random() * 0.2;
        if (hasDM) rafScore += 0.15 + Math.random() * 0.1;
        if (hasHTN) rafScore += 0.05 + Math.random() * 0.05;
        if (hasCVD) rafScore += 0.25 + Math.random() * 0.15;
        if (hasMCC) rafScore += 0.2 + Math.random() * 0.15;
        rafScore = Math.round(rafScore * 1000) / 1000; // Round to 3 decimal places

        // Generate RAF Gap (Uncoded/Suspect HCC opportunity)
        // Patients with chronic conditions are more likely to have uncoded HCCs
        let rafGap = 0;
        if (hasDM || hasHTN || hasCVD || hasMCC) {
            // 40% of chronic patients have uncoded HCCs
            if (Math.random() < 0.40) {
                rafGap = 0.1 + Math.random() * 0.8; // RAF gap between 0.1 and 0.9
            }
        } else {
            // 15% of non-chronic patients have uncoded HCCs
            if (Math.random() < 0.15) {
                rafGap = 0.05 + Math.random() * 0.3; // RAF gap between 0.05 and 0.35
            }
        }
        rafGap = Math.round(rafGap * 1000) / 1000;

        // Calculate Potential RAF (Current + Gap)
        const potentialRaf = Math.round((rafScore + rafGap) * 1000) / 1000;

        // AWV (Annual Wellness Visit) completion status
        // ~50% have completed AWV (matching the 23,911/47,823 from Risk Adjustment tab)
        const awvCompleted = Math.random() < 0.50;
        const awvStatus = awvCompleted ? 'Completed' : 'Incomplete';

        // AWV Date for those who completed
        const awvMonth = Math.floor(Math.random() * 12) + 1;
        const awvDay = Math.floor(Math.random() * 28) + 1;
        const awvDate = awvCompleted ? `${awvMonth}/${awvDay}/2026` : null;

        const hasAppt = Math.random() > 0.5;
        const apptMonth = Math.floor(Math.random() * 6) + 1;
        const apptDay = Math.floor(Math.random() * 28) + 1;

        const lastVisitMonth = Math.floor(Math.random() * 12) + 1;
        const lastVisitDay = Math.floor(Math.random() * 28) + 1;

        patients.push({
            subscriberId: 'SUB' + String(100000000 + i).padStart(10, '0'),
            mrn: 'MRN' + String(Math.floor(Math.random() * 900000) + 100000),
            firstName: firstName,
            lastName: lastName,
            dob: `${birthMonth}/${birthDay}/${birthYear}`,
            gender: gender,
            address: `${Math.floor(Math.random() * 9999) + 1} ${streets[Math.floor(Math.random() * streets.length)]}`,
            city: cities[Math.floor(Math.random() * cities.length)],
            state: 'GA',
            zip: '30' + String(Math.floor(Math.random() * 900) + 100),
            phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 99)}@email.com`,
            pcp: pcps[Math.floor(Math.random() * pcps.length)],
            careManager: careManagers[Math.floor(Math.random() * careManagers.length)],
            rafScore: rafScore,
            rafGap: rafGap,
            potentialRaf: potentialRaf,
            awvStatus: awvStatus,
            awvDate: awvDate,
            lastVisitDate: `${lastVisitMonth}/${lastVisitDay}/2025`,
            nextApptDate: hasAppt ? `${apptMonth}/${apptDay}/2026` : null,
            careGaps: careGaps
        });
    }

    return patients;
}

window.exportFullPatientRoster = exportFullPatientRoster;

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
        modalBody += '<div class="gap-header"><span class="gap-measure">' + gap.measure + (isPrimaryGap ? ' <span style="color:#f39c12;font-weight:bold;">★</span>' : '') + '</span>';
        modalBody += '<span class="gap-status ' + (gap.status === 'Open' ? 'open' : 'closing-soon') + '">' + gap.status + '</span></div>';
        modalBody += '<div class="gap-description">' + gap.description + '</div>';
        modalBody += '<div class="gap-details">';
        modalBody += '<span><strong>Last Action:</strong> ' + gap.lastAction + '</span>';
        modalBody += '<span><strong>Days Open:</strong> ' + gap.daysOpen + '</span>';
        modalBody += '<span><strong>Compliance Date:</strong> ' + gap.complianceDate + '</span>';
        modalBody += '</div></div>';
    });

    modalBody += '</div></div>';
    modalBody += '<div class="appointment-section"><div class="appointment-title"><svg style="width:14px;height:14px;vertical-align:-2px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Next Scheduled Appointment</div>';
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

    // Dynamic measures that should not show forecasted compliance
    const dynamicMeasures = ['Quality-001', 'Quality-236', 'Quality-479'];
    const isDynamic = dynamicMeasures.includes(measureCode);

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
    `;

    // For HbA1c measure, add breakdown cards
    if (measureCode === 'Quality-001') {
        modalBody += `
        <div class="measure-summary-card breakdown-container">
            <div class="breakdown-stack">
                <div class="breakdown-card">
                    <div class="breakdown-label">HbA1c >9</div>
                    <div class="breakdown-value">${measureData.breakdown.hba1cAbove9}</div>
                </div>
                <div class="breakdown-card">
                    <div class="breakdown-label">12 Month Lapse</div>
                    <div class="breakdown-value">${measureData.breakdown.twelveMonthLapse}</div>
                </div>
                <div class="breakdown-card">
                    <div class="breakdown-label">Prospective Lapse</div>
                    <div class="breakdown-value">${measureData.breakdown.prospectiveLapse}</div>
                </div>
            </div>
        </div>
        `;
    } else if (!isDynamic) {
        // Only show forecasted compliance for non-dynamic, non-HbA1c measures
        modalBody += `
        <div class="measure-summary-card">
            <div class="summary-card-label">Forecasted Compliance</div>
            <div class="summary-card-value">${measureData.forecastedCompliance}%</div>
            <div class="summary-card-detail">${measureData.scheduledPatients} scheduled visits</div>
        </div>
        `;
    }

    modalBody += '</div>';

    // Charts Section
    modalBody += '<div class="measure-charts-grid">';

    // Monthly Performance Chart
    modalBody += `
        <div class="measure-chart-card" onclick="showPatientListByMonth('${measureCode}', '${measureName}')">
            <div class="chart-card-title"><svg style="width:14px;height:14px;vertical-align:-2px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 5 6-9"/></svg>Monthly Performance Trend</div>
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

    // Inverted measures where LOWER percentage is better (measure tracks BAD outcomes)
    const invertedMeasures = ['Quality-001']; // HbA1c Poor Control >9%
    const isInverted = invertedMeasures.includes(measureCode);

    // For inverted measures, performance % represents non-compliant patients
    // For normal measures, performance % represents compliant patients
    let compliant, gapCount;
    if (isInverted) {
        // Performance % = patients with poor outcome (non-compliant)
        gapCount = Math.floor(totalPatients * (performance / 100));
        compliant = totalPatients - gapCount;
    } else {
        // Performance % = patients with good outcome (compliant)
        compliant = Math.floor(totalPatients * (performance / 100));
        gapCount = totalPatients - compliant;
    }

    const scheduledPatients = Math.floor(gapCount * 0.4);
    const forecastedCompliance = performance + (scheduledPatients / totalPatients * 100);

    // Generate breakdown data for HbA1c measure
    let breakdown = null;
    if (measureCode === 'Quality-001') {
        // HbA1c >9 and 12 Month Lapse should sum to Gap Opportunity
        const hba1cAbove9 = Math.floor(gapCount * 0.55); // 55% have HbA1c >9
        const twelveMonthLapse = gapCount - hba1cAbove9; // Remaining patients are lapsed (ensures sum = gapCount)
        // Prospective lapse is separate - patients who will become non-compliant next month
        const prospectiveLapse = Math.floor(totalPatients * 0.08); // ~8% will lapse soon
        breakdown = {
            hba1cAbove9: hba1cAbove9,
            twelveMonthLapse: twelveMonthLapse,
            prospectiveLapse: prospectiveLapse
        };
    }

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
        breakdown: breakdown,
        monthlyData: generateMonthlyData(performance),
        regionalData: generateRegionalData(performance),
        providers: generateProviderRankings(totalPatients, performance, isInverted)
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

function generateProviderRankings(totalPatients, avgPerformance, isInverted = false) {
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
        const providerPerformance = Math.max(5, Math.min(95, avgPerformance + complianceVariance));

        let compliantPatients, gapCount, complianceRate;
        if (isInverted) {
            // For inverted measures, providerPerformance % = non-compliant patients
            gapCount = Math.floor(providerPatients * (providerPerformance / 100));
            compliantPatients = providerPatients - gapCount;
            complianceRate = ((compliantPatients / providerPatients) * 100).toFixed(1);
        } else {
            // For normal measures, providerPerformance % = compliant patients
            complianceRate = providerPerformance.toFixed(1);
            compliantPatients = Math.floor(providerPatients * (complianceRate / 100));
            gapCount = providerPatients - compliantPatients;
        }

        return {
            name: name,
            totalPatients: providerPatients,
            compliantPatients: compliantPatients,
            complianceRate: complianceRate,
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

    // Synthetic data disclaimer
    modalBody += `
        <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin: 1.5rem 0; text-align: center;">
            <strong style="color: #856404; font-size: 0.9rem;">⚠️ SYNTHETIC DATA - NOT REAL PHI</strong>
            <div style="color: #856404; font-size: 0.75rem; margin-top: 0.25rem;">Patient-level data is synthetically generated for demonstration purposes only.</div>
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
                        ${measureCode === 'Quality-001' ? '<th>Most Recent<br/>HbA1c Value</th><th>HbA1c Test<br/>Date</th>' : ''}
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
                ${measureCode === 'Quality-001' ? `
                <td>
                    <strong style="color: ${patient.hba1cValue > 9 ? '#e74c3c' : patient.hba1cValue > 7 ? '#f39c12' : '#27ae60'};">${patient.hba1cValue}%</strong>
                </td>
                <td>
                    <div>${patient.hba1cDate}</div>
                </td>
                ` : ''}
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

        // Generate HbA1c data for Quality-001 measure
        let hba1cValue = null;
        let hba1cDate = null;
        if (measureCode === 'Quality-001') {
            // Generate realistic HbA1c values (5.0% to 12.0%)
            // Non-compliant patients tend to have higher values
            if (!isCompliant) {
                hba1cValue = (Math.random() * 4 + 8).toFixed(1); // 8.0-12.0% for non-compliant
            } else {
                hba1cValue = (Math.random() * 3 + 5).toFixed(1); // 5.0-8.0% for compliant
            }

            // Generate test date within last 13 months
            const monthsAgo = Math.floor(Math.random() * 13);
            const testMonth = (new Date().getMonth() - monthsAgo + 12) % 12 + 1;
            const testDay = Math.floor(Math.random() * 28) + 1;
            const testYear = monthsAgo > new Date().getMonth() ? 2025 : 2026;
            hba1cDate = testMonth + '/' + testDay + '/' + testYear;
        }

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
            hba1cValue: hba1cValue,
            hba1cDate: hba1cDate,
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
window.showProviderLeakageDetail = showProviderLeakageDetail;
window.showFacilityLeakageDetail = showFacilityLeakageDetail;
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

// RAF Slider and AWV Compliance functions
window.updateRAFSlider = updateRAFSlider;
window.resetRAFSlider = resetRAFSlider;
window.showAWVComplianceModal = showAWVComplianceModal;
window.updateAWVRAFSlider = updateAWVRAFSlider;
window.resetAWVRAFSlider = resetAWVRAFSlider;
window.showHighValueOutreach = showHighValueOutreach;
window.exportHighValueList = exportHighValueList;
window.showAWVPatientList = showAWVPatientList;
window.exportAWVPatientList = exportAWVPatientList;

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
