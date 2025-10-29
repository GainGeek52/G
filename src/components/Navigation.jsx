import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FaBars, FaTimes, FaShoppingCart, FaUser } from 'react-icons/fa';

export default function Navigation({ cartCount, onCartClick }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdminStatus(user) {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_admin ?? false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      navigate('/');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navigation">
      <div className="nav-content">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <h1>FreshMart</h1>
        </Link>

        <button className="menu-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenu}>
            Home
          </Link>
          
          
          
          {isAdmin && (
            <Link to="/admin" className="nav-link admin-link" onClick={closeMenu}>
              Admin Dashboard
            </Link>
          )}

          <div className="nav-actions">
            {user ? (
              <div className="user-section">
                <span className="user-email">
                  <FaUser /> {user.email}
                </span>
                <button onClick={handleLogout} className="nav-link logout-btn">
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="nav-link login-btn" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/signup" className="nav-link signup-btn" onClick={closeMenu}>
                  Sign Up
                </Link>
              </div>
            )}

            <button 
              className="cart-button" 
              onClick={() => {
                onCartClick();
                closeMenu();
              }}
            >
              <FaShoppingCart />
              <span className="cart-count">{cartCount}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}