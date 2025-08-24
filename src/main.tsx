import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Import Tabler CSS from node_modules
import '@tabler/core/dist/css/tabler.min.css'
// Import Tabler themes CSS for theme customization
import '@tabler/core/dist/css/tabler-themes.min.css'
// Import our custom styles after Tabler
import './styles/main.scss'

// Apply the specific Tabler theme settings you requested
const html = document.documentElement;
html.setAttribute('data-bs-theme-primary', 'cyan');
html.setAttribute('data-bs-theme-base', 'neutral');
html.setAttribute('data-bs-theme-radius', '1.5');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
