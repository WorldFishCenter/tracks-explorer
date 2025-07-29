import React, { useState, useEffect } from 'react';
import { IconUser, IconSun, IconMoon, IconLogout } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import MobileLanguageToggle from '../components/MobileLanguageToggle';

interface MainLayoutProps {
  children: React.ReactNode;
  pageHeader?: React.ReactNode; // Optional header content
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, pageHeader }) => {
  const { logout, currentUser } = useAuth();
  const { t } = useTranslation();
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

  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="page">
      {/* Header - minimal padding */}
      <header className="navbar navbar-expand-md d-print-none py-0 border-bottom">
        <div className="container-xl">
          <div className="navbar-brand navbar-brand-autodark d-flex align-items-center">
            <img src="/favicon/favicon-96x96.png" alt={t('common.peskasLogo')} width="28" height="28" className="me-1 d-sm-none" />
            <img src="/favicon/favicon-96x96.png" alt={t('common.peskasLogo')} width="32" height="32" className="me-2 d-none d-sm-block" />
            <div>
              <h1 className="h4 mb-0 fw-bold d-sm-none">PESKAS</h1>
              <h1 className="h3 mb-0 fw-bold d-none d-sm-block d-md-none">PESKAS</h1>
              <h1 className="h2 mb-0 fw-bold d-none d-md-block">PESKAS</h1>
              <div className="small text-muted mb-0 d-none d-sm-block d-md-none">Portal</div>
              <div className="h4 text-muted mb-0 d-none d-md-block">Fishers Tracking Portal</div>
            </div>
          </div>
          
          <div className="navbar-nav flex-row order-md-last">
            {/* Language switcher - compact on mobile */}
            <div className="nav-item dropdown d-none d-md-flex me-3">
              <LanguageSwitcher />
            </div>
            
            {/* Mobile language switcher - icon only */}
            <div className="nav-item dropdown d-md-none me-2">
              <MobileLanguageToggle />
            </div>
            
            {/* Dark mode toggle */}
            <div className="nav-item dropdown me-2">
              <button
                className="nav-link px-0 btn-icon"
                onClick={toggleDarkMode}
                title={darkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
              >
                {darkMode ? <IconSun size={18} /> : <IconMoon size={18} />}
              </button>
            </div>
            
            {/* Logout button */}
            <div className="nav-item dropdown me-2">
              <button
                className="nav-link px-0 btn-icon"
                onClick={handleLogout}
                title={t('navigation.logout')}
              >
                <IconLogout size={18} />
              </button>
            </div>
            
            {/* User menu */}
            <div className="nav-item dropdown">
              <a href="#" className="nav-link d-flex lh-1 text-reset p-0" data-bs-toggle="dropdown" aria-label={t('common.openUserMenu')}>
                <div className="d-none d-xl-block ps-2">
                  <div>{currentUser?.name || 'User'}</div>
                  <div className="mt-1 small text-muted">{currentUser?.role || 'User'}</div>
                </div>
              </a>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                <a href="#" className="dropdown-item" onClick={handleLogout}>
                  {t('navigation.logout')}
                </a>
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