import React from 'react';
import { IconUser } from '@tabler/icons-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="page">
      {/* Header */}
      <header className="navbar navbar-expand-md navbar-light d-print-none sticky-top">
        <div className="container-xl">
          <h1 className="navbar-brand navbar-brand-autodark">
            Fishers Tracking Portal
          </h1>
          
          <div className="navbar-nav flex-row order-md-last">
            <div className="nav-item dropdown">
              <a href="#" className="nav-link d-flex lh-1 text-reset p-0" data-bs-toggle="dropdown" aria-label="Open user menu">
                <div className="d-none d-xl-block ps-2">
                  <div>Fisher User</div>
                  <div className="mt-1 small text-muted">Fisher Account</div>
                </div>
                <span className="avatar avatar-sm ms-2"><IconUser size={24} /></span>
              </a>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                <a href="#" className="dropdown-item">Profile & account</a>
                <a href="#" className="dropdown-item">Settings</a>
                <div className="dropdown-divider"></div>
                <a href="#" className="dropdown-item">Logout</a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="page-wrapper">
        {/* Main content */}
        <div className="page-body">
          <div className="container-xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout; 