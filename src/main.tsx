import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Import Tabler CSS from node_modules
import '@tabler/core/dist/css/tabler.min.css'
// Import Tabler themes CSS for theme customization
import '@tabler/core/dist/css/tabler-themes.min.css'
// Import our custom styles after Tabler
import './styles/main.scss'

// Initialize offline support
import { initializeOfflineSupport, registerServiceWorkerForOfflineSupport } from './utils/initializeOfflineSupport'

// Apply the specific Tabler theme settings you requested
const html = document.documentElement;
html.setAttribute('data-bs-theme-primary', 'cyan');
html.setAttribute('data-bs-theme-base', 'neutral');
html.setAttribute('data-bs-theme-radius', '1.5');

// Initialize offline support and service worker
const initializeApp = async () => {
  try {
    // Register service worker first
    await registerServiceWorkerForOfflineSupport();
    
    // Then initialize offline storage
    await initializeOfflineSupport();
    
    console.log('🚀 App initialization complete');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
};

// Start initialization
initializeApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
