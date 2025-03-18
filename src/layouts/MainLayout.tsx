import React, { useState, useEffect } from 'react';
import { IconUser, IconSun, IconMoon } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  pageHeader?: React.ReactNode; // Optional header content
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, pageHeader }) => {
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  
  // Initialize dark mode from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial state based on saved preference or system preference
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setDarkMode(isDarkMode);
    
    // Apply theme to document
    applyTheme(isDarkMode);
  }, []);
  
  // Toggle between light and dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Save preference to localStorage
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    
    // Apply theme to document
    applyTheme(newDarkMode);
  };
  
  // Apply theme to the document element
  const applyTheme = (isDark: boolean) => {
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
  };
  
  return (
    <div className="page">
      {/* Header - reduced padding for better spacing */}
      <header className="navbar navbar-expand-md d-print-none">
        <div className="container-xl">
          <h1 className="navbar-brand navbar-brand-autodark mb-0">
            Fishers Tracking Portal
          </h1>
          
          <div className="navbar-nav flex-row order-md-last">
            {/* Dark mode toggle */}
            <div className="nav-item me-3">
              <button 
                className="nav-link px-0 btn-icon" 
                onClick={toggleDarkMode}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <IconSun size={24} /> : <IconMoon size={24} />}
              </button>
            </div>
            
            <div className="nav-item dropdown">
              <a href="#" className="nav-link d-flex lh-1 text-reset p-0" data-bs-toggle="dropdown" aria-label="Open user menu">
                <div className="d-none d-xl-block ps-2">
                  <div>Fisher User</div>
                  <div className="mt-1 small text-secondary">Fisher Account</div>
                </div>
                <span className="avatar avatar-sm ms-2"><IconUser size={24} /></span>
              </a>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                <a href="#" className="dropdown-item">Profile & account</a>
                <a href="#" className="dropdown-item">Settings</a>
                <div className="dropdown-divider"></div>
                <a href="#" className="dropdown-item" onClick={logout}>Logout</a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="page-wrapper">
        {/* Page header with reduced padding/margin for better spacing */}
        <div className="pt-2 pb-0">
          {pageHeader}
        </div>
        
        {/* Main content - reduced top padding */}
        <div className="page-body py-2">
          <div className="container-xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout; 