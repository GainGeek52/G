import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test connection
(async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test categories table
    console.log('Testing categories table...');
    const categoriesTest = await supabase.from('categories').select('*');
    console.log('Categories test result:', categoriesTest);

    // Test products table
    console.log('Testing products table...');
    const productsTest = await supabase.from('products').select('*');
    console.log('Products test result:', productsTest);

    if (categoriesTest.error || productsTest.error) {
      console.error('Tables might not exist or permissions not set:');
      console.error('Categories error:', categoriesTest.error);
      console.error('Products error:', productsTest.error);
    } else {
      console.log('Connection successful!');
      console.log('Found', categoriesTest.data?.length, 'categories');
      console.log('Found', productsTest.data?.length, 'products');
    }
  } catch (err) {
    console.error('Supabase connection test error:', err);
  }
})();

// Expose supabase client to window during development for easy debugging in browser console
// Usage in browser console: await window.supabase.auth.getUser()
if (import.meta.env.DEV) {
  try {
    // eslint-disable-next-line no-undef
    window.supabase = supabase;
    // eslint-disable-next-line no-console
    console.log('Supabase client exposed as window.supabase for debugging');
  } catch (err) {
    // ignore if window is not available (e.g., server-side)
  }
}
