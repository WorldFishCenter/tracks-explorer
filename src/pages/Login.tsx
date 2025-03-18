import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IconDeviceMobile, IconLock, IconInfoCircle } from '@tabler/icons-react';

const Login: React.FC = () => {
  const [imei, setImei] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false); // Debug mode toggle
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim inputs to handle any accidental whitespace
    const trimmedImei = imei.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedImei || !trimmedPassword) {
      setError('Please enter both IMEI and password.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting login with IMEI: "${trimmedImei}", password: "${trimmedPassword}"`);
      await login(trimmedImei, trimmedPassword);
      // Login successful, navigation happens in the App component
    } catch (err) {
      setError('Invalid IMEI or password. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <h1 className="navbar-brand navbar-brand-autodark mb-0 d-flex align-items-center">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/d/d4/Flag_of_Zanzibar.svg" 
              alt="Zanzibar Flag" 
              className="me-2" 
              width="32" 
              height="20" 
              style={{ 
                objectFit: 'cover', 
                border: '1px solid rgba(128, 128, 128, 0.2)',
                borderRadius: '2px'
              }}
            />
            <span className="fs-2">PESKAS</span> <span className="ms-2">| Fishers Tracking Portal</span>
          </h1>
        </div>

        <div className="card card-md">
          <div className="card-body">
            <h2 className="h2 text-center mb-4">Login to your account</h2>
            
            <div className="alert alert-info mb-3" role="alert">
              <div className="d-flex">
                <div>
                  <IconInfoCircle className="me-2" />
                </div>
                <div>
                  Enter your vessel's <strong>IMEI number</strong> and <strong>password</strong> to access your tracking data
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Vessel IMEI</label>
                <div className="input-group input-group-flat">
                  <span className="input-group-text">
                    <IconDeviceMobile size={18} stroke={1.5} />
                  </span>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter 15-digit IMEI number" 
                    value={imei}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImei(e.target.value)}
                    autoComplete="off"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="form-hint">
                  Example: 864352046453593
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Password</label>
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
                <div className="form-hint">
                  For admin access: Use "admin" / "admin"
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
                      Signing in...
                    </>
                  ) : 'Sign in'}
                </button>
              </div>
            </form>
            
            {/* Debug mode toggle and information */}
            <div className="mt-3 text-center">
              <button 
                className="btn btn-sm btn-outline-secondary" 
                onClick={() => setDebugMode(!debugMode)}
                type="button"
              >
                {debugMode ? "Hide Debug Info" : "Show Debug Info"}
              </button>
            </div>
            
            {debugMode && (
              <div className="mt-3 p-2" style={{ border: '1px dashed #ccc' }}>
                <h5>Available Test Accounts:</h5>
                <pre className="small">
                  IMEI: 864352046453593, Password: C?0C8rrP (Mashaallah, Bububu)
                </pre>
                <pre className="small">
                  IMEI: 864352047658075, Password: ZnVwfFE$ (Tuimarike kengeja, Kengeja)
                </pre>
                <pre className="small">
                  IMEI: 864352047657473, Password: jJ--@3u* (Hazal, Bububu)
                </pre>
                <pre className="small">
                  IMEI: 864352046458428, Password: UT-xJ6dk (Matoro Kilimani)
                </pre>
                <pre className="small">
                  IMEI: admin, Password: admin (Admin access)
                </pre>
                <h6 className="mt-3">Current Input Values (for debugging):</h6>
                <pre className="small">
                  IMEI: "{imei}" (length: {imei.length})
                </pre>
                <pre className="small">
                  Password: "{password}" (length: {password.length})
                </pre>
                <pre className="small">
                  Char codes: {[...password].map(c => c.charCodeAt(0)).join(', ')}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 