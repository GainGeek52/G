import { useState } from 'react';

export default function Header({ cartCount, onCartClick }) {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1>FreshMart</h1>
            <p>Your Daily Grocery Store</p>
          </div>

          <nav className="nav">
            <button className="nav-link">Home</button>
            <button className="nav-link">Products</button>
            <button className="nav-link">About</button>
            <button className="cart-button" onClick={onCartClick}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 2L7 6H3L6 20H18L21 6H17L15 2H9Z"/>
                <circle cx="9" cy="21" r="1"/>
                <circle cx="15" cy="21" r="1"/>
              </svg>
              Cart ({cartCount})
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
