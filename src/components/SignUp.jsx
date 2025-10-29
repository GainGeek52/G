import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSignUp(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // trim email to avoid leading/trailing spaces causing validation errors
      const emailTrimmed = email.trim();

      // basic client-side validation
      const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!isValidEmail(emailTrimmed)) {
        setError('Please enter a valid email address (e.g. name@example.com)');
        setLoading(false);
        return;
      }

      // detect common domain typos and suggest corrections
      const domain = emailTrimmed.split('@')[1]?.toLowerCase();
      const localPart = emailTrimmed.split('@')[0] || '';
      const commonTypos = {
        'gamil.com': 'gmail.com',
        'gmial.com': 'gmail.com',
        'hotmial.com': 'hotmail.com',
        'yahho.com': 'yahoo.com'
      };
      if (domain && commonTypos[domain]) {
        const suggestion = `${localPart}@${commonTypos[domain]}`;
        setError(`Did you mean ${suggestion}? Please correct the email and try again.`);
        setLoading(false);
        return;
      }

      // supabase-js v2 signature: signUp(credentials, options?)
      const resp = await supabase.auth.signUp(
        { email: emailTrimmed, password },
        { emailRedirectTo: `${window.location.origin}/login` }
      );

      console.log('signUp response:', resp);

      if (resp.error) {
        console.error('Sign up error details:', resp.error);
        throw resp.error;
      }

      // Successfully signed up
      alert('Check your email for the confirmation link!');
      navigate('/login');
      
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSignUp} className="auth-form">
        <h2>Create Account</h2>
        
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
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <div className="auth-links">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}