import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Bucket used for product image uploads. Configure in .env as
// VITE_PRODUCT_IMAGES_BUCKET (defaults to 'product-images')
const PRODUCT_IMAGES_BUCKET = import.meta.env.VITE_PRODUCT_IMAGES_BUCKET || 'product-images';

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    stock: '',
    unit: 'piece'
  });
  const [imageFile, setImageFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // get current user and subscribe to auth changes so RLS authenticated checks work
    (async () => {
      try {
        const {
          data: { user: currentUser }
        } = await supabase.auth.getUser();
        setUser(currentUser ?? null);
      } catch (err) {
        console.error('Error getting auth user:', err);
      }
    })();

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);

      // Get current authenticated user (may be null if not signed in)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // If no authenticated user, show no products in the admin list
      const userId = userData?.user?.id;
      if (!userId) {
        setProducts([]);
        return;
      }

      // Fetch products belonging to the signed-in user
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Show a friendly alert in admin UI but avoid a hard crash
      alert('Error fetching products: ' + (error?.message || error));
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    if (!user) {
      alert('You must be signed in to add products. Please sign in from the Login page.');
      return;
    }
    try {
      let productToInsert = { ...newProduct };

      // If an image file was selected, upload it to Supabase Storage and set image_url
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
  const filePath = `${PRODUCT_IMAGES_BUCKET}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        // Use configurable bucket name
        const { error: uploadError } = await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .upload(filePath, imageFile, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          // Throw so outer catch can handle and provide a helpful message
          throw uploadError;
        }

        const { data: publicData } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);
        productToInsert.image_url = publicData?.publicUrl || '';
      }

      const { data, error } = await supabase
        .from('products')
        .insert([productToInsert])
        .select();

      if (error) throw error;
      setProducts([...products, data[0]]);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        stock: '',
        unit: 'piece'
      });
      setImageFile(null);
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);

      // Detect common storage bucket not found error and provide actionable guidance
      const isBucketNotFound =
        error?.message?.toLowerCase().includes('bucket not found') || error?.status === 404;

      if (isBucketNotFound) {
        alert(
          `Storage bucket "${PRODUCT_IMAGES_BUCKET}" not found. Create this bucket in your Supabase project (Storage -> Buckets) or set VITE_PRODUCT_IMAGES_BUCKET to the correct bucket name in your .env and restart the dev server.`
        );
      } else {
        // Generic error message but include the underlying message when available
        alert(`Error adding product: ${error?.message || 'Unknown error'}`);
      }
    }
  }

  async function handleUpdateProduct(e) {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .update(editingProduct)
        .eq('id', editingProduct.id)
        .select();

      if (error) throw error;
      setProducts(products.map(p => p.id === editingProduct.id ? data[0] : p));
      setEditingProduct(null);
      alert('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product');
    }
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    }
  }

  return (
    <div className="admin-panel">
      <h2 className="section-title">Admin Dashboard</h2>
      <div style={{ marginBottom: 12 }}>
        Signed in as: <strong>{user?.email ?? 'Not signed in'}</strong>
      </div>

      <div className="admin-content">
        <div className="product-form-section">
          <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="product-form">
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={editingProduct ? editingProduct.name : newProduct.name}
                onChange={e => editingProduct 
                  ? setEditingProduct({...editingProduct, name: e.target.value})
                  : setNewProduct({...newProduct, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                value={editingProduct ? editingProduct.description : newProduct.description}
                onChange={e => editingProduct
                  ? setEditingProduct({...editingProduct, description: e.target.value})
                  : setNewProduct({...newProduct, description: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price:</label>
              <input
                type="number"
                id="price"
                step="0.01"
                value={editingProduct ? editingProduct.price : newProduct.price}
                onChange={e => editingProduct
                  ? setEditingProduct({...editingProduct, price: e.target.value})
                  : setNewProduct({...newProduct, price: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                value={editingProduct ? editingProduct.category_id : newProduct.category_id}
                onChange={e => editingProduct
                  ? setEditingProduct({...editingProduct, category_id: e.target.value})
                  : setNewProduct({...newProduct, category_id: e.target.value})}
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="image">Image URL or upload file:</label>
              <input
                type="url"
                id="image"
                placeholder="https://example.com/image.jpg"
                value={editingProduct ? editingProduct.image_url : newProduct.image_url}
                onChange={e => editingProduct
                  ? setEditingProduct({...editingProduct, image_url: e.target.value})
                  : setNewProduct({...newProduct, image_url: e.target.value})}
              />
              <div style={{ marginTop: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files?.[0] ?? null)}
                />
                {imageFile && <div style={{ marginTop: 6 }}>{imageFile.name}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="stock">Stock:</label>
              <input
                type="number"
                id="stock"
                value={editingProduct ? editingProduct.stock : newProduct.stock}
                onChange={e => editingProduct
                  ? setEditingProduct({...editingProduct, stock: e.target.value})
                  : setNewProduct({...newProduct, stock: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="unit">Unit:</label>
              <select
                id="unit"
                value={editingProduct ? editingProduct.unit : newProduct.unit}
                onChange={e => editingProduct
                  ? setEditingProduct({...editingProduct, unit: e.target.value})
                  : setNewProduct({...newProduct, unit: e.target.value})}
                required
              >
                <option value="piece">Piece</option>
                <option value="kg">Kilogram</option>
                <option value="g">Gram</option>
                <option value="l">Liter</option>
                <option value="ml">Milliliter</option>
              </select>
            </div>

            <button type="submit" className="submit-button" disabled={!user}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
            {!user && (
              <div style={{ marginTop: 8, color: '#b00' }}>
                You are not signed in. Please <a href="/login">sign in</a> to manage products.
              </div>
            )}
            {editingProduct && (
              <button
                type="button"
                className="cancel-button"
                onClick={() => setEditingProduct(null)}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        <div className="products-list-section">
          <h3>Products List</h3>
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.categories?.name}</td>
                      <td>${product.price}</td>
                      <td>{product.stock} {product.unit}</td>
                      <td>
                        <button
                          className="edit-button"
                          onClick={() => setEditingProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}