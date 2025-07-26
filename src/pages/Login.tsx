import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { IconDeviceMobile, IconLock, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Login: React.FC = () => {
  const [imei, setImei] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim inputs to handle any accidental whitespace
    const trimmedImei = imei.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedImei || !trimmedPassword) {
      setError(t('auth.enterBothFields'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await login(trimmedImei, trimmedPassword);
      // Login successful, navigation happens in the App component
    } catch (err) {
      setError(t('auth.invalidCredentials'));
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-center">
      {/* Language switcher in top right corner */}
      <div className="position-absolute top-0 end-0 p-3">
        <LanguageSwitcher />
      </div>
      
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <h1 className="navbar-brand navbar-brand-autodark mb-0 d-flex align-items-center justify-content-center">
            <img src="/favicon/favicon-96x96.png" alt="PESKAS logo" width="48" height="48" className="me-2" />
            <span className="fs-2">PESKAS</span> <span className="ms-2">| {t('dashboard.pageTitle')}</span>
          </h1>
        </div>

        <div className="card card-md">
          <div className="card-body">
            <h2 className="h2 text-center mb-4">{t('auth.loginTitle')}</h2>
            
            <div className="alert alert-info mb-3" role="alert">
              <div className="d-flex">
                <div>
                  <IconInfoCircle className="me-2" />
                </div>
                <div>
                  {t('auth.loginInfo')}
                </div>
              </div>
            </div>

            {error && (
              <>
                <div className="alert alert-danger mb-3" role="alert">
                  <div className="d-flex">
                    <div>
                      <IconAlertTriangle className="me-2" />
                    </div>
                    <div>
                      {error}
                    </div>
                  </div>
                </div>
                
                <div className="alert alert-warning mb-3" role="alert">
                  <div className="d-flex">
                    <div>
                      <IconInfoCircle className="me-2" />
                    </div>
                                    <div>
                  <strong>{t('auth.troubleshootingTitle')}</strong>
                  <ul className="mt-1 mb-0">
                    {(t('auth.troubleshootingTips', { returnObjects: true }) as string[]).map((tip: string, index: number) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">{t('auth.imeiOrBoatName')}</label>
                <div className="input-group input-group-flat">
                  <span className="input-group-text">
                    <IconDeviceMobile size={18} stroke={1.5} />
                  </span>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter IMEI number or Boat name" 
                    value={imei}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImei(e.target.value)}
                    autoComplete="off"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="form-hint">
                  Example: 864312346401234 or "my boat name"
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">{t('auth.password')}</label>
                <div className="input-group input-group-flat">
                  <span className="input-group-text">
                    <IconLock size={18} stroke={1.5} />
                  </span>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Your password" 
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              
              <div className="form-footer">
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {t('common.loading')}...
                    </>
                  ) : t('auth.loginButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 