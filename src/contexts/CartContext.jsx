import { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../api';
import { useAuth } from './AuthContext';
const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth(); 
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setCartCount(0);
      setTotal(0);
      return;
    }

    try {
      const res = await userAPI.get('/cart');
      const items = res.data?.data?.items || [];
      const totalAmount = res.data?.data?.total || 0;
      
      setCartItems(items);
      setTotal(totalAmount);
      
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalQuantity);
    } catch (err) {
      console.log('Failed to fetch cart:', err);
      setCartItems([]);
      setCartCount(0);
      setTotal(0);
    }
  };

  const addToCart = async (packageId, quantity = 1) => {
    if (!isAuthenticated) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    try {
      await userAPI.post('/cart', {
        package_id: packageId,
        quantity: quantity
      });
      await fetchCart();
      return { success: true };
    } catch (err) {
      console.log('Failed to add to cart:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (!isAuthenticated) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    try {
      await userAPI.put(`/cart/${itemId}`, { quantity: newQuantity });
      await fetchCart(); 
      return { success: true };
    } catch (err) {
      console.log('Failed to update quantity:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    if (!isAuthenticated) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    try {
      await userAPI.delete(`/cart/${itemId}`);
      await fetchCart(); 
      return { success: true };
    } catch (err) {
      console.log('Failed to remove item:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setCartCount(0);
    setTotal(0);
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, authLoading]);

  const value = {
    cartItems,
    cartCount,
    total,
    loading,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};