import React, { useState, useEffect } from 'react';
import { IconUser, IconSun, IconMoon, IconLogout, IconChevronDown } from '@tabler/icons-react';
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
            <img src="/favicon/favicon-96x96.png" alt={t('common.peskasLogo')} width="42" height="42" className="me-2 d-sm-none" />
            <img src="/favicon/favicon-96x96.png" alt={t('common.peskasLogo')} width="50" height="50" className="me-3 d-none d-sm-block" />
            <div>
              <div className="d-sm-none">
                <h1 className="h3 mb-0 fw-bold">PESKAS</h1>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>2.3</div>
              </div>
              <div className="d-none d-sm-block d-md-none">
                <h1 className="h3 mb-0 fw-bold">PESKAS</h1>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Portal 2.3</div>
              </div>
              <div className="d-none d-md-block">
                <h1 className="h2 mb-0 fw-bold">PESKAS</h1>
                <div className="h4 text-muted mb-0">Fishers Tracking Portal <span style={{ fontSize: '0.75rem' }}>2.3</span></div>
              </div>
            </div>
          </div>
          
          <div className="navbar-nav flex-row order-md-last">
            {/* Dark mode toggle */}
            <div className="nav-item me-2">
              <button
                className="nav-link px-2 btn btn-ghost-secondary btn-icon"
                onClick={toggleDarkMode}
                title={darkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                {darkMode ? <IconSun size={20} /> : <IconMoon size={20} />}
              </button>
            </div>
            
            {/* Language switcher - compact on mobile */}
            <LanguageSwitcher />
            
            {/* Mobile language switcher - icon only */}
            <MobileLanguageToggle />
            
            {/* User dropdown menu */}
            <div className="nav-item dropdown">
              <a href="#" className="nav-link d-flex lh-1 text-reset px-2 py-2" data-bs-toggle="dropdown" aria-label={t('common.openUserMenu')} style={{ minHeight: '44px' }}>
                <IconUser size={20} className="me-2" />
                {currentUser?.name && (
                  <div className="d-none d-sm-block me-2">
                    <div>{currentUser.name}</div>
                    {currentUser.role && currentUser.role.toLowerCase() !== 'user' && (
                      <div className="mt-1 small text-muted">{currentUser.role}</div>
                    )}
                  </div>
                )}
                <IconChevronDown size={16} className="ms-auto" />
              </a>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                <div className="dropdown-header">
                  {currentUser?.name && (
                    <div className="fw-bold">{currentUser.name}</div>
                  )}
                  {currentUser?.role && currentUser.role.toLowerCase() !== 'user' && (
                    <div className="small text-muted">{currentUser.role}</div>
                  )}
                  {currentUser?.imeis && currentUser.imeis.length > 0 && (
                    <div className="small text-muted mt-1">
                      IMEI: {currentUser.imeis.join(', ')}
                    </div>
                  )}
                </div>
                <div className="dropdown-divider"></div>
                <a href="#" className="dropdown-item" onClick={handleLogout}>
                  <IconLogout size={16} className="me-2" />
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