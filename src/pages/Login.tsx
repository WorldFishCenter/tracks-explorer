import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IconDeviceMobile, IconLock, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';

const Login: React.FC = () => {
  const [imei, setImei] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim inputs to handle any accidental whitespace
    const trimmedImei = imei.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedImei || !trimmedPassword) {
      setError('Please enter both IMEI/Boat name and password.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await login(trimmedImei, trimmedPassword);
      // Login successful, navigation happens in the App component
    } catch (err) {
      setError('Invalid IMEI/Boat name or password. Please try again.');
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
            <img src="/favicon/favicon-96x96.png" alt="PESKAS logo" width="48" height="48" className="me-2" />
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
                  Enter your vessel's <strong>IMEI number</strong> or <strong>Boat name</strong> and <strong>password</strong> to access your tracking data.
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
                      <strong>Troubleshooting tips:</strong>
                      <ul className="mt-1 mb-0">
                        <li>Make sure your IMEI is exactly 15 digits long</li>
                        <li>Check that your boat name matches exactly how it's registered</li>
                        <li>Verify your password is correct (passwords are case-sensitive)</li>
                        <li>If problems persist, contact your system administrator</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">IMEI or Boat Name</label>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 