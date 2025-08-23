import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { IconDeviceMobile, IconLock, IconInfoCircle, IconAlertTriangle, IconLanguage, IconCheck } from '@tabler/icons-react';
import { useLanguage } from '../hooks/useLanguage';
import { LANGUAGE_FLAGS, SUPPORTED_LANGUAGES } from '../constants/languages';

const Login: React.FC = () => {
  const [imei, setImei] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();
  const { languages, currentLanguage, changeLanguage } = useLanguage();

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

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
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <h1 className="navbar-brand navbar-brand-autodark mb-0 d-flex align-items-center justify-content-center">
            <img src="/favicon/favicon-96x96.png" alt={t('common.peskasLogo')} width="48" height="48" className="me-2" />
            <span className="fs-2">PESKAS</span> <span className="ms-2">| Fishers Tracking Portal</span>
          </h1>
          
          {/* Language switcher below the title - mobile friendly */}
          <div className="mt-3 d-flex justify-content-center">
            <div className="dropdown">
              <button 
                className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                title={t('language.selectLanguage')}
                style={{ 
                  fontSize: '1rem', 
                  padding: '0.75rem 1rem',
                  minWidth: '140px',
                  height: '50px'
                }}
              >
                <span className="me-2" style={{ fontSize: '1.2rem' }}>{currentLanguage.flag}</span>
                <span className="small">{currentLanguage.name}</span>
              </button>
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <small className="text-muted">{t('language.selectLanguage')}</small>
                </div>
                {languages.map((language) => (
                  <button
                    key={language.code}
                    className={`dropdown-item d-flex align-items-center ${
                      currentLanguage.code === language.code ? 'active' : ''
                    }`}
                    onClick={() => handleLanguageChange(language.code)}
                    type="button"
                    style={{ minHeight: '44px' }}
                  >
                    <span className="me-2 fs-5">{language.flag}</span>
                    <span className="flex-grow-1">{language.name}</span>
                    {currentLanguage.code === language.code && (
                      <IconCheck size={16} className="text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
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
                    placeholder={t('common.enterImeiOrBoatName')}
                    value={imei}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImei(e.target.value)}
                    autoComplete="off"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="form-hint">
                  {t('common.exampleImeiOrBoatName')}
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
                    placeholder={t('common.yourPassword')}
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
                  style={{ minHeight: '48px' }}
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