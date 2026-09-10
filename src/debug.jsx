import { useAuth } from './context/useAuth';
import { useEffect, useState } from 'react';

export const Debug = () => {
  const auth = useAuth();
  const [apiTest, setApiTest] = useState(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        const response = await fetch('http://localhost:5005/api/health');
        const data = await response.json();
        setApiTest({ success: true, data });
      } catch (err) {
        setApiTest({ success: false, error: err.message });
      }
    };
    testApi();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>Debug Info</h1>

      <h3>Auth Context:</h3>
      <pre>{JSON.stringify({
        user: auth.user,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        error: auth.error,
      }, null, 2)}</pre>

      <h3>API Health Check:</h3>
      <pre>{JSON.stringify(apiTest, null, 2)}</pre>

      <h3>Environment:</h3>
      <pre>{JSON.stringify({
        apiUrl: import.meta.env.VITE_API_URL,
        mode: import.meta.env.MODE,
      }, null, 2)}</pre>
    </div>
  );
};