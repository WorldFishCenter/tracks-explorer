import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Import Tabler CSS from node_modules
import '@tabler/core/dist/css/tabler.min.css'
// Import our custom styles after Tabler
import './styles/main.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
