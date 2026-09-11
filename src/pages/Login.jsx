import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, loginWithSalesforce } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result?.success) {
      navigate('/');
    } else {
      setError(result?.error || 'Login failed');
    }
  };

  const handleSalesforceLogin = async () => {
    await loginWithSalesforce();
  };

  return (
    <div style={{
      maxWidth: '420px',
      margin: '2rem auto',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2>Login to Sales Pipeline Intelligence</h2>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          marginBottom: '16px',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <span style={{ fontSize: '14px' }}>
          Don't have an account?{' '}
          <a href="/signup" style={{ color: '#007bff', textDecoration: 'none' }}>
            Sign up
          </a>
        </span>
      </div>

      <button
        onClick={handleSalesforceLogin}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#f0f0f0',
          color: '#333',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '10px'
        }}
      >
        Sign in with Salesforce
      </button>
    </div>
  );
}