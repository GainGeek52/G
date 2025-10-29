import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      // attempt sign in and log full response for debugging
      const resp = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('signInWithPassword response:', resp);

      // resp has shape { data: { session, user }, error }
      if (resp.error) {
        // show full error message to developer console and friendly message to user
        console.error('Login error details:', resp.error);
        throw resp.error;
      }

      // Successfully logged in
      console.log('Login successful, session:', resp.data.session);
      // navigate to admin
      window.location.href = '/admin';
    } catch (error) {
      console.error('Error logging in:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Admin Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}