// Main entry point - imports styles and initializes the application
import './styles/main.css'
import './styles/components.css'
import './styles/charts.css'
import './styles/modals.css'
import './styles/mobile.css'

// Import Chart.js and D3 from npm packages
import Chart from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'

// Register the datalabels plugin globally
Chart.register(ChartDataLabels)

// Set global defaults for datalabels
Chart.defaults.set('plugins.datalabels', {
    color: '#2c3e50',
    font: {
        weight: 'bold',
        size: 11
    },
    anchor: 'end',
    align: 'top',
    offset: 4
})

// Make Chart and d3 available globally for the app
window.Chart = Chart
window.d3 = d3
window.sankey = sankey
window.sankeyLinkHorizontal = sankeyLinkHorizontal

// Import the application logic
import './app.js'
