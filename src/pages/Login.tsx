import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IconUser, IconLock, IconInfoCircle } from '@tabler/icons-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await login(username, password);
      // Login successful, navigation happens in the App component
    } catch (err) {
      setError('Invalid username/IMEI or password. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <h1 className="navbar-brand navbar-brand-autodark">
            Fishers Tracking Portal
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
                  You can log in using your <strong>vessel's IMEI number</strong> (15 digits) to view data for that vessel only.
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
                <label className="form-label">Username or IMEI</label>
                <div className="input-group input-group-flat">
                  <span className="input-group-text">
                    <IconUser size={18} stroke={1.5} />
                  </span>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter username or vessel IMEI" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="form-hint">
                  For IMEI login, enter your 15-digit IMEI number
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
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="form-hint">
                  Demo access: Use "Admin User" / "password" or your IMEI / any password
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