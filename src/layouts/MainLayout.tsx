import React, { useState, useEffect } from 'react';
import { IconUser, IconSun, IconMoon, IconLogout } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  pageHeader?: React.ReactNode; // Optional header content
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, pageHeader }) => {
  const { logout, currentUser } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  
  // Initialize dark mode from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    // Set initial state based on saved preference or default to light mode
    const isDarkMode = savedTheme === 'dark';
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
      {/* Header - minimal padding */}
      <header className="navbar navbar-expand-md d-print-none py-0 border-bottom">
        <div className="container-xl">
          <div className="navbar-brand navbar-brand-autodark d-flex align-items-center">
            <img src="/favicon/favicon-96x96.png" alt="PESKAS logo" width="36" height="36" className="me-2" />
            <div>
              <h1 className="h2 mb-0 fw-bold">PESKAS</h1>
              <div className="h4 text-muted mb-0">Fishers Tracking Portal</div>
            </div>
          </div>
          
          <div className="navbar-nav flex-row order-md-last">
            {/* Dark mode toggle */}
            <div className="nav-item me-2">
              <button 
                className="nav-link px-0 btn-icon" 
                onClick={toggleDarkMode}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <IconSun size={20} /> : <IconMoon size={20} />}
              </button>
            </div>
            
            {/* Logout button */}
            <div className="nav-item me-2">
              <button 
                className="nav-link px-0 btn-icon" 
                onClick={logout}
                title="Logout"
              >
                <IconLogout size={20} />
              </button>
            </div>
            
            <div className="nav-item dropdown">
              <a href="#" className="nav-link d-flex lh-1 text-reset p-0" data-bs-toggle="dropdown" aria-label="Open user menu">
                <div className="d-none d-xl-block ps-2">
                  <div>{currentUser?.name || 'Unknown Vessel'}</div>
                  <div className="mt-1 small text-secondary">
                    IMEI: {currentUser?.imeis?.[0] || 'N/A'}
                  </div>
                </div>
                <span className="avatar avatar-sm ms-2"><IconUser size={20} /></span>
              </a>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                <a href="#" className="dropdown-item">Profile & account</a>
                <a href="#" className="dropdown-item">Settings</a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="page-wrapper mt-0">
        {/* Page header with no extra padding */}
        {pageHeader}
        
        {/* Main content with no extra padding */}
        <div className="page-body pt-0">
          <div className="container-xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout; 