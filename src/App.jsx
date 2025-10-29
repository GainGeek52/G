import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Components
import Admin from './components/Admin';
import Cart from './components/Cart';
import CategoryFilter from './components/CategoryFilter';
import Hero from './components/Hero';
import Login from './components/Login';
import ProductGrid from './components/ProductGrid';
import SignUp from './components/SignUp';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const [error, setError] = useState(null);

  async function fetchCategories() {
    try {
      console.log('Fetching categories...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      console.log('Categories response:', { data, error });

      if (error) {
        throw error;
      }

      setCategories(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
      setCategories([]);
    }
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('name');

      if (error) {
        throw error;
      }

      setProducts(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  const handleAddToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);

      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { id: Date.now().toString(), product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Router>
      <div className="app">
        <Navigation cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/" element={
            <>
              <Hero />
              <main className="main">
                <div className="container">
                  <section className="products-section">
                    <h2 className="section-title">Our Products</h2>

                    <CategoryFilter
                      categories={categories}
                      selectedCategory={selectedCategory}
                      onSelectCategory={setSelectedCategory}
                    />

                    {error ? (
                      <div className="error-message">
                        {error}
                        <button onClick={() => {
                          setError(null);
                          fetchCategories();
                          fetchProducts();
                        }}>
                          Try Again
                        </button>
                      </div>
                    ) : loading ? (
                      <div className="loading">Loading products...</div>
                    ) : (
                      <ProductGrid
                        products={filteredProducts}
                        onAddToCart={handleAddToCart}
                      />
                    )}
                  </section>
                </div>
              </main>
            </>
          } />
        </Routes>

        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />

        <footer className="footer">
          <div className="container">
            <p>2025 FreshMart. Quality groceries delivered fresh.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
