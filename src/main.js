// Main entry point - imports styles and initializes the application
import './styles/main.css'
import './styles/components.css'
import './styles/charts.css'
import './styles/modals.css'
import './styles/mobile.css'

// Import Chart.js and D3 from npm packages
import Chart from 'chart.js/auto'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'

// Make Chart and d3 available globally for the app
window.Chart = Chart
window.d3 = d3
window.sankey = sankey
window.sankeyLinkHorizontal = sankeyLinkHorizontal

// Import the application logic
import './app.js'
